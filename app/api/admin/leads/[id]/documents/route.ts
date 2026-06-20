import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { AttachLeadDocumentUseCase } from '@/application/use-cases/leads/AttachLeadDocumentUseCase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { fileKey, fileName, mimeType, direction, category, sourceMediaId } = body

    if (!fileKey || !fileName || !direction) {
      return Response.json({ error: 'fileKey, fileName y direction son requeridos' }, { status: 400 })
    }

    const useCase = new AttachLeadDocumentUseCase(
      new DrizzleLeadDocumentRepository(),
      new DrizzleLeadActivityRepository(),
    )

    const document = await useCase.execute({
      leadId: id,
      fileKey,
      fileName,
      mimeType,
      direction,
      category,
      sourceMediaId,
      uploadedBy: (session.user as any)?.id,
    })

    return Response.json({ success: true, document }, { status: 201 })
  } catch (error) {
    console.error('Error attaching lead document:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
