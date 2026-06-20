import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { ArchiveLeadDocumentUseCase } from '@/application/use-cases/leads/ArchiveLeadDocumentUseCase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { documentId } = await params
    const useCase = new ArchiveLeadDocumentUseCase(new DrizzleLeadDocumentRepository())
    const document = await useCase.execute(documentId)

    return Response.json({ success: true, document })
  } catch (error) {
    console.error('Error archiving lead document:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
