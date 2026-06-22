import { Lead } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { LeadContact } from '@/core/entities/LeadContact'
import { Quote } from '@/core/entities/Quote'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { ILeadContactRepository } from '@/core/repositories/ILeadContactRepository'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'

export class CreateLeadForQuoteUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private leadContactRepository: ILeadContactRepository,
    private pipelineStageRepository: IPipelineStageRepository,
  ) {}

  async execute(quote: Quote): Promise<Lead> {
    const existing = await this.leadRepository.findByQuoteId(quote.id)
    if (existing) return existing

    const stages = await this.pipelineStageRepository.findAll()
    const defaultStage = stages.find((s) => s.isDefault) ?? stages[0]
    if (!defaultStage) {
      throw new Error('No pipeline stages configured. Did the pipeline_stages seed migration run?')
    }

    const lead = Lead.create({ quoteId: quote.id, stageId: defaultStage.id })
    await this.leadRepository.save(lead)

    // Seed the primary contact so it has an id and can be selected later
    // (e.g. by event scheduling). phone falls back to '' because the public
    // quote form makes phone optional, but lead_contacts.phone is NOT NULL —
    // a deliberate, documented trade-off.
    //
    // Non-fatal: this runs inside the public quote-submission path, so a
    // failure here must not fail the whole request — the Lead itself is
    // already saved and must be returned regardless.
    try {
      const contact = LeadContact.create({
        leadId: lead.id,
        name: quote.name,
        phone: quote.phone?.toString() ?? '',
        email: quote.email.toString(),
        isPrimary: true,
      })
      await this.leadContactRepository.save(contact)
    } catch (error) {
      console.error(`Failed to seed primary contact for lead ${lead.id}:`, error)
    }

    const activity = LeadActivity.create({
      leadId: lead.id,
      type: 'stage_change',
      payload: { from: null, to: 'prospect', reason: 'quote_submitted' },
    })
    await this.leadActivityRepository.save(activity)

    return lead
  }
}
