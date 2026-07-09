import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { SubmitForReviewUseCase } from '@/application/use-cases/legal/SubmitForReviewUseCase'
import { LegalDocumentNotEditableError } from '@/core/entities/LegalDocument'
import { serializeLegalDocument } from '../../serialize'

const Schema = z.object({ reviewNote: z.string().max(2000).nullable().optional() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const input = Schema.parse(body)

    const repository = new DrizzleLegalDocumentRepository()
    const document = await new SubmitForReviewUseCase(repository).execute(id, input.reviewNote)

    return Response.json({ document: serializeLegalDocument(document) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    if (error instanceof LegalDocumentNotEditableError) {
      return Response.json({ error: error.message }, { status: 409 })
    }
    console.error('Error submitting legal document for review:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
