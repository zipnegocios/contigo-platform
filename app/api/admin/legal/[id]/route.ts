import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { SaveLegalDocumentDraftUseCase } from '@/application/use-cases/legal/SaveLegalDocumentDraftUseCase'
import { LegalDocumentNotEditableError } from '@/core/entities/LegalDocument'
import { serializeLegalDocument } from '../serialize'

const UpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(50000).optional(),
  effectiveDate: z.string().datetime().nullable().optional(),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const document = await new DrizzleLegalDocumentRepository().findById(id)
    if (!document) return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json({ document: serializeLegalDocument(document) })
  } catch (error) {
    console.error('Error fetching legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const input = UpdateSchema.parse(body)

    const repository = new DrizzleLegalDocumentRepository()
    const document = await new SaveLegalDocumentDraftUseCase(repository).executeEdit(id, {
      title: input.title,
      content: input.content,
      effectiveDate: input.effectiveDate === undefined ? undefined : input.effectiveDate ? new Date(input.effectiveDate) : null,
    })

    return Response.json({ document: serializeLegalDocument(document) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    if (error instanceof LegalDocumentNotEditableError) {
      return Response.json({ error: error.message }, { status: 409 })
    }
    console.error('Error updating legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
