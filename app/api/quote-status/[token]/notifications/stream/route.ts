import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { createSSEStream } from '@/infrastructure/realtime/createSSEStream'
import {
  GetLeadNotificationFeedUseCase,
  LeadNotificationFeedDTO,
} from '@/application/use-cases/portal/GetLeadNotificationFeedUseCase'

export const dynamic = 'force-dynamic'

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

    // Token→quote→lead is resolved exactly once above, before entering the
    // stream. `fetchSnapshot` below only does the cheap per-tick query using
    // the already-resolved `lead.id` — it must never re-resolve token/quote/lead.
    const useCase = new GetLeadNotificationFeedUseCase(
      new DrizzleLeadRepository(),
      new DrizzleLeadActivityRepository(),
      new DrizzlePipelineStageRepository(),
    )

    return createSSEStream<LeadNotificationFeedDTO>(request, {
      fetchSnapshot: () => useCase.execute(lead.id),
      hasChanged: (prev, next) => {
        if (!prev) return true // shouldn't happen (createSSEStream always sends the first snapshot unconditionally) but keep this defensive
        if (prev.items.length !== next.items.length) return true
        if (prev.unreadCount !== next.unreadCount) return true
        // Items are newest-first (see GetLeadNotificationFeedUseCase), so
        // index 0 is the newest item.
        return prev.items[0]?.id !== next.items[0]?.id
      },
      serialize: (data) => JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error streaming tracking panel notifications:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
