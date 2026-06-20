import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { ScheduleLeadEventUseCase } from '@/application/use-cases/leads/ScheduleLeadEventUseCase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type, scheduledAt, durationMinutes, location, notes } = body

    if (!type || !scheduledAt) {
      return Response.json({ error: 'type y scheduledAt son requeridos' }, { status: 400 })
    }

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
    })

    return Response.json({ success: true, event }, { status: 201 })
  } catch (error) {
    console.error('Error scheduling lead event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
