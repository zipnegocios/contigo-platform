import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { DrizzleSecurityEventLogger } from '@/infrastructure/services/DrizzleSecurityEventLogger'
import { PublishLegalDocumentUseCase, MissingRequiredAnchorsError } from '@/application/use-cases/legal/PublishLegalDocumentUseCase'
import { LegalDocumentNotPublishableError } from '@/core/entities/LegalDocument'
import { revalidatePath } from 'next/cache'
import { serializeLegalDocument } from '../../serialize'

const Schema = z.object({ reviewNote: z.string().max(2000).nullable().optional() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    const role = (session.user as any)?.role
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Publishing is the irreversible step (archives the previously live
    // version); the repo only has owner/staff roles, so this is owner-only
    // regardless of granular legal.manage grants (plan §3.5).
    if (role !== 'owner') {
      return Response.json({ error: 'Only owners can publish legal documents' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const input = Schema.parse(body)

    const repository = new DrizzleLegalDocumentRepository()
    const { document, softWarnings } = await new PublishLegalDocumentUseCase(
      repository,
      new DrizzleSecurityEventLogger(),
    ).execute(id, userId, input.reviewNote)

    revalidatePath(`/legal/${document.slug}`)
    revalidatePath('/legal')
    revalidatePath('/sitemap.xml')

    return Response.json({ document: serializeLegalDocument(document), softWarnings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    if (error instanceof MissingRequiredAnchorsError) {
      return Response.json({ error: error.message, missing: error.missing }, { status: 422 })
    }
    if (error instanceof LegalDocumentNotPublishableError) {
      return Response.json({ error: error.message }, { status: 409 })
    }
    console.error('Error publishing legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
