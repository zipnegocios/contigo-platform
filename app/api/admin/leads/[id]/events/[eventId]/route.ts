import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { UpdateLeadEventStatusUseCase } from '@/application/use-cases/leads/UpdateLeadEventStatusUseCase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  try {
    const { eventId } = await params
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { status } = await request.json()
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show']
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'status inválido' }, { status: 400 })
    }

    const useCase = new UpdateLeadEventStatusUseCase(
      new DrizzleLeadEventRepository(),
      new DrizzleLeadActivityRepository(),
    )
    await useCase.execute(eventId, status, (session.user as any)?.id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error updating lead event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
