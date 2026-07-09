import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { SaveLegalDocumentDraftUseCase } from '@/application/use-cases/legal/SaveLegalDocumentDraftUseCase'
import { LEGAL_ANCHOR_REQUIREMENTS } from '@/core/config/legal-requirements'
import { extractHeadingIds } from '@/infrastructure/markdown/legal-markdown'
import { serializeLegalDocument } from './serialize'

const CreateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.enum(['website', 'service', 'general']),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(50000),
  effectiveDate: z.string().datetime().nullable().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const repository = new DrizzleLegalDocumentRepository()
    const documents = await new ListLegalDocumentsUseCase(repository).execute()

    return Response.json({
      documents: documents.map((doc) => {
        const anchors = extractHeadingIds(doc.content)
        const requirements = LEGAL_ANCHOR_REQUIREMENTS[doc.slug] ?? []
        const missingRequiredAnchors = requirements
          .filter((r) => !anchors.includes(r.anchorId))
          .map((r) => ({ anchorId: r.anchorId, requiredBy: r.requiredBy, active: r.active }))
        return { ...serializeLegalDocument(doc), missingRequiredAnchors }
      }),
    })
  } catch (error) {
    console.error('Error listing legal documents:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const input = CreateSchema.parse(body)

    const repository = new DrizzleLegalDocumentRepository()
    const document = await new SaveLegalDocumentDraftUseCase(repository).execute({
      slug: input.slug,
      domain: input.domain,
      title: input.title,
      content: input.content,
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
      createdBy: userId,
    })

    return Response.json({ document: serializeLegalDocument(document) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error creating legal document draft:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
