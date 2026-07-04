import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { createSSEStream } from '@/infrastructure/realtime/createSSEStream'
import { GetLeadClientStageUseCase, ClientStageDTO } from '@/application/use-cases/portal/GetLeadClientStageUseCase'

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

    const getLeadClientStageUseCase = new GetLeadClientStageUseCase(
      new DrizzleQuoteRepository(),
      new DrizzleLeadRepository(),
      new DrizzlePipelineStageRepository(),
    )

    const clientStage = await getLeadClientStageUseCase.execute(token)
    if (!clientStage) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    return createSSEStream<ClientStageDTO>(request, {
      // The use case re-resolves the token every tick here — that's the entire
      // point of this route existing separately from the full panel use case,
      // to keep each tick cheap: just quote+lead+stage lookups, no
      // documents/events/messages.
      fetchSnapshot: () => getLeadClientStageUseCase.execute(token) as Promise<ClientStageDTO>,
      hasChanged: (prev, next) => !prev || prev.key !== next.key || prev.label !== next.label,
      serialize: (data) => JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error streaming tracking panel status:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
