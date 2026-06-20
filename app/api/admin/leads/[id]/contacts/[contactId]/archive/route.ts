import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { ArchiveLeadContactUseCase } from '@/application/use-cases/leads/ArchiveLeadContactUseCase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { contactId } = await params
    const useCase = new ArchiveLeadContactUseCase(new DrizzleLeadContactRepository())
    const contact = await useCase.execute(contactId)

    return Response.json({ success: true, contact })
  } catch (error) {
    console.error('Error archiving lead contact:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
