import { Lead, LeadStage } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class ChangeLeadStageUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(leadId: string, newStage: LeadStage, createdBy?: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    const previousStage = lead.stage
    const updated = lead.withStage(newStage)
    await this.leadRepository.update(updated)

    if (previousStage !== newStage) {
      const activity = LeadActivity.create({
        leadId,
        type: 'stage_change',
        payload: { from: previousStage, to: newStage },
        createdBy,
      })
      await this.leadActivityRepository.save(activity)
    }

    return updated
  }
}
