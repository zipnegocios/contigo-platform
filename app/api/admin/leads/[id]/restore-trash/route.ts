import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { RestoreLeadFromTrashUseCase } from '@/application/use-cases/leads/RestoreLeadFromTrashUseCase'
import { toLeadDTO } from '@/presentation/types/LeadDTO'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.archive'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const useCase = new RestoreLeadFromTrashUseCase(new DrizzleLeadRepository())
    const lead = await useCase.execute(id)

    return Response.json({ success: true, lead: toLeadDTO(lead) })
  } catch (error) {
    console.error('Error restoring lead from trash:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
