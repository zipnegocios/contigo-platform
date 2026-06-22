import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
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

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
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

    // Email.create / Phone.create throw plain Errors prefixed this way for
    // invalid input — surface those as client errors (400) rather than 500.
    if (
      error instanceof Error &&
      (error.message.startsWith('Invalid email format') ||
        error.message.startsWith('Invalid phone number'))
    ) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
