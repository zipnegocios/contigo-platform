import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { UpdateLeadContactUseCase } from '@/application/use-cases/leads/UpdateLeadContactUseCase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { contactId } = await params
    const body = await request.json()
    const { name, phone, email, roleId } = body

    const useCase = new UpdateLeadContactUseCase(new DrizzleLeadContactRepository())
    const contact = await useCase.execute(contactId, { name, phone, email, roleId })

    return Response.json({ success: true, contact })
  } catch (error) {
    console.error('Error updating lead contact:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
