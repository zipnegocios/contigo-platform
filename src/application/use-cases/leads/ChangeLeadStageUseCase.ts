import { Lead } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'

// NOTE: terminal-stage side effects (e.g. auto-closing related records when
// landing on a 'won'/'lost' stage) are intentionally out of scope here — this
// use case only validates that the target stage exists before persisting it.
export class ChangeLeadStageUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private pipelineStageRepository: IPipelineStageRepository,
  ) {}

  async execute(leadId: string, newStageId: string, createdBy?: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    const targetStage = await this.pipelineStageRepository.findById(newStageId)
    if (!targetStage) throw new Error('Pipeline stage not found')

    const previousStageId = lead.stageId
    const updated = lead.withStage(newStageId)
    await this.leadRepository.update(updated)

    if (previousStageId !== newStageId) {
      const activity = LeadActivity.create({
        leadId,
        type: 'stage_change',
        payload: { from: previousStageId, to: newStageId },
        createdBy,
      })
      await this.leadActivityRepository.save(activity)
    }

    return updated
  }
}
