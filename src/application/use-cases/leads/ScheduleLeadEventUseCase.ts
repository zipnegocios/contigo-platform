import { LeadEvent, LeadEventType, LeadEventMetadata } from '@/core/entities/LeadEvent'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class ScheduleLeadEventUseCase {
  constructor(
    private leadEventRepository: ILeadEventRepository,
    private leadActivityRepository: ILeadActivityRepository,
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
      payload: {
        eventId: event.id,
        scheduledAt: input.scheduledAt.toISOString(),
        location: input.location,
        contactId,
      },
      createdBy: input.createdBy,
    })
    await this.leadActivityRepository.save(activity)

    return event
  }
}
