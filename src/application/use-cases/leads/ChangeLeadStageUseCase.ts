import { Lead } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

// NOTE: Task 2.3 owns rebuilding this use case properly against the
// pipeline_stages domain (e.g. validating the target stageId exists,
// resolving terminal-stage side effects). For now it just persists the
// new stageId and records the activity — no validation beyond "lead exists".
export class ChangeLeadStageUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(leadId: string, newStageId: string, createdBy?: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

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
