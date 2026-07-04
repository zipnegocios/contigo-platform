import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'
import { createSSEStream } from '@/infrastructure/realtime/createSSEStream'
import { toPublicMessageDTO, PublicMessageDTO } from '@/presentation/types/PublicMessageDTO'

export const dynamic = 'force-dynamic'

interface MessagesSnapshot {
  messages: PublicMessageDTO[]
  unreadStaffMessages: number
}

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

    const leadMessageRepository = new DrizzleLeadMessageRepository()

    return createSSEStream<MessagesSnapshot>(request, {
      fetchSnapshot: async () => {
        const messages = await leadMessageRepository.findByLeadId(lead.id)
        const unreadStaffMessages = await leadMessageRepository.countUnread(lead.id, 'staff')
        return { messages: messages.map(toPublicMessageDTO), unreadStaffMessages }
      },
      hasChanged: (prev, next) => {
        if (!prev) return true // shouldn't happen (createSSEStream always sends the first snapshot unconditionally) but keep this defensive
        if (prev.messages.length !== next.messages.length) return true
        if (prev.unreadStaffMessages !== next.unreadStaffMessages) return true
        const prevLast = prev.messages[prev.messages.length - 1]
        const nextLast = next.messages[next.messages.length - 1]
        return prevLast?.id !== nextLast?.id
      },
      serialize: (data) => JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error streaming tracking panel messages:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
