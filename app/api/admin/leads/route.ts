import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { toLeadDTO } from '@/presentation/types/LeadDTO'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') ?? undefined
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
    const archived = searchParams.get('archived') === 'true'
    const trashed = searchParams.get('trashed') === 'true'

    const leadRepo = new DrizzleLeadRepository()
    const quoteRepo = new DrizzleQuoteRepository()

    const leads = await leadRepo.findAllFiltered({
      stage,
      createdFrom: from,
      createdTo: to,
      onlyArchived: archived,
      onlyTrashed: trashed,
    })
    const enriched = await Promise.all(
      leads.map(async (lead) => {
        const quote = await quoteRepo.findById(lead.quoteId)
        return { ...toLeadDTO(lead), quote: quote ? toQuoteDTO(quote) : null }
      }),
    )

    return Response.json({ leads: enriched })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
