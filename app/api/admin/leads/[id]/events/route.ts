import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { ScheduleLeadEventUseCase } from '@/application/use-cases/leads/ScheduleLeadEventUseCase'

export const LeadEventMetadataSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('call'), contactId: z.string().uuid().nullable() }),
  z.object({
    kind: z.literal('site_visit'),
    contactId: z.string().uuid().nullable(),
    mapsLink: z.string().nullable(),
    address: z.string().nullable(),
    referencePoint: z.string().nullable(),
  }),
  z.object({
    kind: z.literal('meeting'),
    channel: z.enum(['google_meet', 'zoom', 'teams', 'whatsapp', 'other']),
    link: z.string().nullable(),
  }),
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type, scheduledAt, durationMinutes, location, notes, metadata } = body

    if (!type || !scheduledAt) {
      return Response.json({ error: 'type and scheduledAt are required' }, { status: 400 })
    }

    const parsedMetadata = LeadEventMetadataSchema.parse(metadata)

    const useCase = new ScheduleLeadEventUseCase(
      new DrizzleLeadEventRepository(),
      new DrizzleLeadActivityRepository(),
    )

    const event = await useCase.execute({
      leadId: id,
      type,
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      location,
      notes,
      createdBy: (session.user as any)?.id,
      metadata: parsedMetadata,
    })

    return Response.json({ success: true, event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error scheduling lead event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
