import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { generatePresignedGetUrl } from '@/infrastructure/services/R2StorageService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return Response.json({ error: 'key is required' }, { status: 400 })
    }

    const lead = await new DrizzleLeadRepository().findById(id)
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })

    const quote = await new DrizzleQuoteRepository().findById(lead.quoteId)
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 })

    if (!quote.attachmentUrls.includes(key)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bucket = process.env.R2_QUOTES_BUCKET
    if (!bucket) {
      return Response.json({ error: 'R2_QUOTES_BUCKET not configured' }, { status: 500 })
    }

    const url = await generatePresignedGetUrl(bucket, key, 300)
    return Response.json({ url })
  } catch (error) {
    console.error('Error generating attachment URL:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
