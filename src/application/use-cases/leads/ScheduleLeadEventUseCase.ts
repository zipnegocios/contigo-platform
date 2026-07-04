import { LeadEvent, LeadEventType, LeadEventMetadata } from '@/core/entities/LeadEvent'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { IEmailService } from '@/core/services/IEmailService'

export class ScheduleLeadEventUseCase {
  constructor(
    private leadEventRepository: ILeadEventRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private leadRepository: ILeadRepository,
    private quoteRepository: IQuoteRepository,
    private emailService: IEmailService,
  ) {}

  async execute(input: {
    leadId: string
    type: LeadEventType
    scheduledAt: Date
    durationMinutes?: number
    location?: string
    notes?: string
    createdBy?: string
    metadata: LeadEventMetadata
  }): Promise<LeadEvent> {
    const event = LeadEvent.create(input)
    await this.leadEventRepository.save(event)

    const contactId = input.metadata.kind !== 'meeting' ? input.metadata.contactId : null

    const ACTIVITY_TYPE_BY_EVENT_TYPE = {
      call: 'call_scheduled',
      site_visit: 'visit_scheduled',
      meeting: 'event_scheduled',
      follow_up: 'event_scheduled',
    } as const

    const activity = LeadActivity.create({
      leadId: input.leadId,
      type: ACTIVITY_TYPE_BY_EVENT_TYPE[input.type],
      payload: { eventId: event.id, scheduledAt: input.scheduledAt.toISOString(), location: input.location, contactId },
      createdBy: input.createdBy,
    })
    await this.leadActivityRepository.save(activity)

    const lead = await this.leadRepository.findById(input.leadId)
    const quote = lead ? await this.quoteRepository.findById(lead.quoteId) : null

    if (lead && quote) {
      try {
        await this.emailService.sendEventScheduledNotificationToClient(quote, event)
      } catch (error) {
        console.error(`Failed to send event-scheduled client notification for lead ${input.leadId}:`, error)
      }

      try {
        await this.emailService.sendEventScheduledNotificationToAdmin(lead, quote, event)
      } catch (error) {
        console.error(`Failed to send event-scheduled admin notification for lead ${input.leadId}:`, error)
      }
    } else {
      console.warn(`No lead/quote found for lead ${input.leadId} — skipping event-scheduled emails`)
    }

    return event
  }
}
