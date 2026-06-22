import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { RestoreLeadEventUseCase } from '@/application/use-cases/leads/RestoreLeadEventUseCase'
import { toLeadEventDTO } from '@/presentation/types/LeadEventDTO'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { eventId } = await params
    const useCase = new RestoreLeadEventUseCase(new DrizzleLeadEventRepository())
    const event = await useCase.execute(eventId)

    return Response.json({ success: true, event: toLeadEventDTO(event) })
  } catch (error) {
    console.error('Error restoring lead event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
