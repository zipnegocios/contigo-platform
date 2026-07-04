import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'

// Public, unauthenticated endpoint reached via a capability URL (tracking token).
// Every failure case below returns 404 — never 403 — so an attacker probing
// tokens cannot distinguish "exists but forbidden" from "doesn't exist".
//
// Lightweight peek for the client's notification bell — does NOT mark anything
// as read (that only happens when the client actually opens the thread via GET
// /messages).
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

    // Unread staff messages — what the client hasn't seen yet.
    const count = await new DrizzleLeadMessageRepository().countUnread(lead.id, 'staff')

    return Response.json({ count })
  } catch (error) {
    console.error('Error fetching tracking panel unread message count:', error)
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
