import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { generatePresignedGetUrl } from '@/infrastructure/services/R2StorageService'

// Public, unauthenticated endpoint reached via a capability URL (tracking token).
// Every failure case below returns 404 — never 403 — so an attacker probing
// tokens/document ids cannot distinguish "exists but forbidden" from "doesn't exist".
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; documentId: string }> },
) {
  try {
    const { token, documentId } = await params

    const quote = await new DrizzleQuoteRepository().findByToken(token)
    if (!quote) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const lead = await new DrizzleLeadRepository().findByQuoteId(quote.id)
    if (!lead) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const document = await new DrizzleLeadDocumentRepository().findById(documentId)
    if (!document) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    if (
      document.leadId !== lead.id ||
      document.direction !== 'admin_sent' ||
      document.archivedAt !== null
    ) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const bucket = process.env.R2_QUOTES_BUCKET
    if (!bucket) {
      console.error('R2_QUOTES_BUCKET is not configured')
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    const url = await generatePresignedGetUrl(bucket, document.fileKey, 300)
    return Response.json({ url })
  } catch (error) {
    console.error('Error generating document download URL:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
