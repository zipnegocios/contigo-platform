import { Lead } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class CreateLeadForQuoteUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(quoteId: string): Promise<Lead> {
    const existing = await this.leadRepository.findByQuoteId(quoteId)
    if (existing) return existing

    const lead = Lead.create({ quoteId })
    await this.leadRepository.save(lead)

    const activity = LeadActivity.create({
      leadId: lead.id,
      type: 'stage_change',
      payload: { from: null, to: 'prospect', reason: 'quote_submitted' },
    })
    await this.leadActivityRepository.save(activity)

    return lead
  }
}
