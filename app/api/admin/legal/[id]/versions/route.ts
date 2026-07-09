import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { serializeLegalDocument } from '../../serialize'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const repository = new DrizzleLegalDocumentRepository()
    const document = await repository.findById(id)
    if (!document) return Response.json({ error: 'Not found' }, { status: 404 })

    const versions = await new ListLegalDocumentsUseCase(repository).versions(document.slug)
    return Response.json({ versions: versions.map(serializeLegalDocument) })
  } catch (error) {
    console.error('Error listing legal document versions:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
