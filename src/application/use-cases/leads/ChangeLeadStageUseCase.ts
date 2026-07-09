import { Lead } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { IEmailService } from '@/core/services/IEmailService'
import { getClientStageLabel } from '@/presentation/lib/clientStageLabels'
import { ScheduleReviewRequestUseCase } from '@/application/use-cases/reviews/ScheduleReviewRequestUseCase'

// NOTE: terminal-stage side effects are otherwise out of scope here — the
// one exception is the review-request scheduling below (plan Phase 5),
// which is deliberately best-effort: it must never fail the stage change.
export class ChangeLeadStageUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private pipelineStageRepository: IPipelineStageRepository,
    private quoteRepository: IQuoteRepository,
    private emailService: IEmailService,
    // Optional: omit at call sites that don't need the reviews module wired
    // up (e.g. tests), matching this use case's existing lightweight DI style.
    private scheduleReviewRequestUseCase?: ScheduleReviewRequestUseCase,
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

      const quote = await this.quoteRepository.findById(lead.quoteId)

      if (quote) {
        const previousStage = await this.pipelineStageRepository.findById(previousStageId)
        const fromLabel = getClientStageLabel(previousStage?.key ?? '').label
        const toLabel = getClientStageLabel(targetStage.key).label

        try {
          await this.emailService.sendStageChangeNotificationToClient(quote, toLabel)
        } catch (error) {
          console.error(`Failed to send stage-change client notification for lead ${leadId}:`, error)
        }

        try {
          await this.emailService.sendStageChangeNotificationToAdmin(updated, quote, fromLabel, toLabel)
        } catch (error) {
          console.error(`Failed to send stage-change admin notification for lead ${leadId}:`, error)
        }
      } else {
        console.warn(`No quote found for lead ${leadId} (quoteId ${lead.quoteId}) — skipping stage-change emails`)
      }

      if (targetStage.terminalKind === 'won' && this.scheduleReviewRequestUseCase) {
        try {
          await this.scheduleReviewRequestUseCase.execute(leadId)
        } catch (error) {
          console.error(`Failed to schedule review request for lead ${leadId}:`, error)
        }
      }
    }

    return updated
  }
}
