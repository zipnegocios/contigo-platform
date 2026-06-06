import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { Lead } from '@/core/entities/Lead'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return Response.json({ error: 'Status is required' }, { status: 400 })
    }

    const quoteRepo = new DrizzleQuoteRepository()
    const quote = await quoteRepo.findById(params.id)

    if (!quote) {
      return Response.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Update quote status
    const updatedQuote = quote.withStatus(status as 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed')
    await quoteRepo.update(updatedQuote)

    // Create or update lead record
    const leadRepo = new DrizzleLeadRepository()
    let lead = await leadRepo.findByQuoteId(quote.id)

    if (!lead) {
      // Create new lead if it doesn't exist
      lead = Lead.create({ quoteId: quote.id })
      await leadRepo.save(lead)
    }

    // Update lead status based on quote status
    let updatedLead = lead.withStage(mapQuoteStatusToLeadStage(status))
    if (notes) {
      updatedLead = updatedLead.withNotes(notes)
    }
    await leadRepo.update(updatedLead)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error updating quote:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

function mapQuoteStatusToLeadStage(quoteStatus: string): 'prospect' | 'contacted' | 'quoted' | 'won' | 'lost' {
  const mapping: Record<string, 'prospect' | 'contacted' | 'quoted' | 'won' | 'lost'> = {
    new: 'prospect',
    contacted: 'contacted',
    in_progress: 'quoted',
    converted: 'won',
    closed: 'lost',
  }
  return mapping[quoteStatus] || 'prospect'
}
