import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { generatePresignedGetUrl } from '@/infrastructure/services/R2StorageService'

// Public, unauthenticated endpoint reached via a capability URL (tracking token).
// Every failure case below returns 404 — never 403 — so an attacker probing
// tokens/keys cannot distinguish "exists but forbidden" from "doesn't exist".
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const quote = await new DrizzleQuoteRepository().findByToken(token)
    if (!quote) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    if (!quote.attachmentUrls.includes(key)) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const bucket = process.env.R2_QUOTES_BUCKET
    if (!bucket) {
      console.error('R2_QUOTES_BUCKET is not configured')
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    const url = await generatePresignedGetUrl(bucket, key, 300)
    return Response.json({ url })
  } catch (error) {
    console.error('Error generating attachment download URL:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
