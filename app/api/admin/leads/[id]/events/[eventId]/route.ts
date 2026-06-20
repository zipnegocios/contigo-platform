import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { UpdateLeadEventStatusUseCase } from '@/application/use-cases/leads/UpdateLeadEventStatusUseCase'
import { UpdateLeadEventUseCase } from '@/application/use-cases/leads/UpdateLeadEventUseCase'
import { LeadEventMetadataSchema } from '../route'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  try {
    const { eventId } = await params
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    if (body.status !== undefined) {
      const { status } = body
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show']
      if (!validStatuses.includes(status)) {
        return Response.json({ error: 'invalid status' }, { status: 400 })
      }

      const useCase = new UpdateLeadEventStatusUseCase(
        new DrizzleLeadEventRepository(),
        new DrizzleLeadActivityRepository(),
      )
      await useCase.execute(eventId, status, (session.user as any)?.id)

      return Response.json({ success: true })
    }

    const { scheduledAt, durationMinutes, notes, metadata } = body
    const parsedMetadata = metadata ? LeadEventMetadataSchema.parse(metadata) : undefined

    const useCase = new UpdateLeadEventUseCase(new DrizzleLeadEventRepository())
    const event = await useCase.execute(eventId, {
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      durationMinutes,
      notes,
      metadata: parsedMetadata,
    })

    return Response.json({ success: true, event })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error updating lead event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
