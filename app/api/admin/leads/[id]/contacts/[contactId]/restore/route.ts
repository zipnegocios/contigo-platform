import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { RestoreLeadContactUseCase } from '@/application/use-cases/leads/RestoreLeadContactUseCase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { contactId } = await params
    const useCase = new RestoreLeadContactUseCase(new DrizzleLeadContactRepository())
    const contact = await useCase.execute(contactId)

    return Response.json({ success: true, contact })
  } catch (error) {
    console.error('Error restoring lead contact:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
