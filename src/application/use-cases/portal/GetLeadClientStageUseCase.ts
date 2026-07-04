import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'
import { getClientStageLabel } from '@/presentation/lib/clientStageLabels'

export interface ClientStageDTO {
  key: string
  label: string
  description: string
}

/**
 * Resolves the client-safe pipeline stage for a public tracking token.
 *
 * Extracted from `GetTrackingPanelDataUseCase` so a tight polling loop (the
 * `status/stream` SSE route) can re-resolve token → quote → lead → stage every
 * tick without also re-fetching documents/events/messages.
 */
export class GetLeadClientStageUseCase {
  constructor(
    private quoteRepository: IQuoteRepository,
    private leadRepository: ILeadRepository,
    private pipelineStageRepository: IPipelineStageRepository,
  ) {}

  async execute(token: string): Promise<ClientStageDTO | null> {
    const quote = await this.quoteRepository.findByToken(token)
    if (!quote) return null

    const lead = await this.leadRepository.findByQuoteId(quote.id)
    if (!lead) return null

    const stage = await this.pipelineStageRepository.findById(lead.stageId)
    const clientStageMeta = getClientStageLabel(stage?.key ?? '')

    return {
      key: stage?.key ?? '',
      label: clientStageMeta.label,
      description: clientStageMeta.description,
    }
  }
}
