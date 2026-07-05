import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { GetLeadNotificationFeedUseCase } from '@/application/use-cases/portal/GetLeadNotificationFeedUseCase'

// Public, unauthenticated endpoint reached via a capability URL (tracking token).
// Every failure case below returns 404 — never 403 — so an attacker probing
// tokens cannot distinguish "exists but forbidden" from "doesn't exist".
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const quote = await new DrizzleQuoteRepository().findByToken(token)
    if (!quote) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const lead = await new DrizzleLeadRepository().findByQuoteId(quote.id)
    if (!lead) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const useCase = new GetLeadNotificationFeedUseCase(
      new DrizzleLeadRepository(),
      new DrizzleLeadActivityRepository(),
      new DrizzlePipelineStageRepository(),
    )

    const result = await useCase.execute(lead.id)

    return Response.json(result)
  } catch (error) {
    console.error('Error fetching tracking panel notifications:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Deliberately a POST, not a GET: a GET here would risk a stray link-prefetch
// or crawler silently clearing the client's unread badge. A POST requires an
// explicit client-side fetch call, which only intentional UI interaction triggers.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const quote = await new DrizzleQuoteRepository().findByToken(token)
    if (!quote) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const leadRepository = new DrizzleLeadRepository()
    const lead = await leadRepository.findByQuoteId(quote.id)
    if (!lead) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const updatedLead = lead.withNotificationsViewedAt(new Date())
    await leadRepository.update(updatedLead)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error marking tracking panel notifications as viewed:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
