import { LeadEventStatus } from '@/core/entities/LeadEvent'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { IEmailService } from '@/core/services/IEmailService'

const STATUS_TO_ACTIVITY = {
  completed: { call: 'call_completed', site_visit: 'visit_completed', meeting: 'event_completed', follow_up: 'event_completed' },
  cancelled: { call: 'call_cancelled', site_visit: 'visit_cancelled', meeting: 'event_cancelled', follow_up: 'event_cancelled' },
} as const

export class UpdateLeadEventStatusUseCase {
  constructor(
    private leadEventRepository: ILeadEventRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private leadRepository: ILeadRepository,
    private quoteRepository: IQuoteRepository,
    private emailService: IEmailService,
  ) {}

  async execute(eventId: string, status: LeadEventStatus, createdBy?: string): Promise<void> {
    const event = await this.leadEventRepository.findById(eventId)
    if (!event) throw new Error('Lead event not found')

    const updated = event.withStatus(status)
    await this.leadEventRepository.update(updated)

    const activityType = (STATUS_TO_ACTIVITY as any)[status]?.[event.type]
    if (activityType) {
      const activity = LeadActivity.create({ leadId: event.leadId, type: activityType, payload: { eventId: event.id }, createdBy })
      await this.leadActivityRepository.save(activity)
    }

    if (status === 'cancelled') {
      const lead = await this.leadRepository.findById(event.leadId)
      const quote = lead ? await this.quoteRepository.findById(lead.quoteId) : null

      if (lead && quote) {
        try {
          await this.emailService.sendEventCancelledNotificationToClient(quote, updated)
        } catch (error) {
          console.error(`Failed to send event-cancelled client notification for lead ${event.leadId}:`, error)
        }

        try {
          await this.emailService.sendEventCancelledNotificationToAdmin(lead, quote, updated)
        } catch (error) {
          console.error(`Failed to send event-cancelled admin notification for lead ${event.leadId}:`, error)
        }
      } else {
        console.warn(`No lead/quote found for lead ${event.leadId} — skipping event-cancelled emails`)
      }
    }
  }
}
