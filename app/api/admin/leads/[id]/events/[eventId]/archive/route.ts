import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { ArchiveLeadEventUseCase } from '@/application/use-cases/leads/ArchiveLeadEventUseCase'
import { toLeadEventDTO } from '@/presentation/types/LeadEventDTO'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { eventId } = await params
    const useCase = new ArchiveLeadEventUseCase(new DrizzleLeadEventRepository())
    const event = await useCase.execute(eventId)

    return Response.json({ success: true, event: toLeadEventDTO(event) })
  } catch (error) {
    console.error('Error archiving lead event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
