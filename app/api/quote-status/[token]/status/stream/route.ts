import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { createSSEStream } from '@/infrastructure/realtime/createSSEStream'
import { ClientStageDTO } from '@/application/use-cases/portal/GetLeadClientStageUseCase'
import { getClientStageLabel } from '@/presentation/lib/clientStageLabels'

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

    const pipelineStageRepository = new DrizzlePipelineStageRepository()

    // Quote and lead are resolved once above and never re-fetched. Only the
    // pipeline stage can change over the life of a connection (an admin may
    // move the lead while the SSE connection is open), so this is the only
    // lookup `fetchSnapshot` repeats per tick.
    const getStageSnapshot = async (): Promise<ClientStageDTO> => {
      const stage = await pipelineStageRepository.findById(lead.stageId)
      const clientStageMeta = getClientStageLabel(stage?.key ?? '')
      return {
        key: stage?.key ?? '',
        label: clientStageMeta.label,
        description: clientStageMeta.description,
      }
    }

    return createSSEStream<ClientStageDTO>(request, {
      fetchSnapshot: getStageSnapshot,
      hasChanged: (prev, next) => !prev || prev.key !== next.key || prev.label !== next.label,
      serialize: (data) => JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error streaming tracking panel status:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
