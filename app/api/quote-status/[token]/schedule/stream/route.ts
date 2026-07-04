import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { createSSEStream } from '@/infrastructure/realtime/createSSEStream'
import { LeadEventType } from '@/core/entities/LeadEvent'

export const dynamic = 'force-dynamic'

interface ScheduleEventSnapshot {
  id: string
  type: LeadEventType
  scheduledAt: Date
  durationMinutes: number
  location: string | null
  // Internal diffing detail for this route only — not part of the client-facing
  // shape from GetTrackingPanelDataUseCase.
  updatedAt: Date
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

    const leadEventRepository = new DrizzleLeadEventRepository()

    return createSSEStream<ScheduleEventSnapshot[]>(request, {
      fetchSnapshot: async () => {
        const allEvents = await leadEventRepository.findByLeadId(lead.id)
        return allEvents
          .filter((e) => e.status !== 'cancelled')
          .map((e) => ({
            id: e.id,
            type: e.type,
            scheduledAt: e.scheduledAt,
            durationMinutes: e.durationMinutes,
            location: e.location,
            updatedAt: e.updatedAt,
          }))
      },
      hasChanged: (prev, next) => {
        if (!prev) return true
        if (prev.length !== next.length) return true
        const prevMax = Math.max(0, ...prev.map((e) => e.updatedAt.getTime()))
        const nextMax = Math.max(0, ...next.map((e) => e.updatedAt.getTime()))
        return prevMax !== nextMax
      },
      serialize: (data) => JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error streaming tracking panel schedule:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
