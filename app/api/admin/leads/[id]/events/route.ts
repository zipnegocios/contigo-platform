import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { ScheduleLeadEventUseCase } from '@/application/use-cases/leads/ScheduleLeadEventUseCase'
import { toLeadEventDTO } from '@/presentation/types/LeadEventDTO'

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
  z.object({ kind: z.literal('follow_up'), contactId: z.string().uuid().nullable() }),
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, scheduledAt, durationMinutes, location, notes, metadata } = body

    if (!type || !scheduledAt) {
      return Response.json({ error: 'type and scheduledAt are required' }, { status: 400 })
    }

    const parsedMetadata = LeadEventMetadataSchema.parse(metadata)

    const useCase = new ScheduleLeadEventUseCase(
      new DrizzleLeadEventRepository(),
      new DrizzleLeadActivityRepository(),
      new DrizzleLeadRepository(),
      new DrizzleQuoteRepository(),
      new ResendEmailService(),
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

    return Response.json({ success: true, event: toLeadEventDTO(event) }, { status: 201 })
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
