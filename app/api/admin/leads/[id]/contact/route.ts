import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { UpdateQuoteContactUseCase } from '@/application/use-cases/leads/UpdateQuoteContactUseCase'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'

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
    const { name, email, phone } = body

    if (!name || !email) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const leadRepo = new DrizzleLeadRepository()
    const lead = await leadRepo.findById(params.id)
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 })
    }

    const quoteRepo = new DrizzleQuoteRepository()
    const updateQuoteContactUseCase = new UpdateQuoteContactUseCase(quoteRepo)

    const updatedQuote = await updateQuoteContactUseCase.execute(lead.quoteId, {
      name,
      email,
      phone,
    })

    return Response.json({ success: true, quote: toQuoteDTO(updatedQuote) })
  } catch (error) {
    console.error('Error updating lead contact:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
