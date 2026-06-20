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

    const activity = LeadActivity.create({
      leadId: input.leadId,
      type: input.type === 'call' ? 'call_scheduled' : 'visit_scheduled',
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
