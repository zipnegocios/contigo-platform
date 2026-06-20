import { LeadEventStatus } from '@/core/entities/LeadEvent'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

const STATUS_TO_ACTIVITY = {
  completed: { call: 'call_completed', site_visit: 'visit_completed', meeting: 'visit_completed' },
  cancelled: { call: 'call_cancelled', site_visit: 'visit_cancelled', meeting: 'visit_cancelled' },
} as const

export class UpdateLeadEventStatusUseCase {
  constructor(
    private leadEventRepository: ILeadEventRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(eventId: string, status: LeadEventStatus, createdBy?: string): Promise<void> {
    const event = await this.leadEventRepository.findById(eventId)
    if (!event) throw new Error('Lead event not found')

    const updated = event.withStatus(status)
    await this.leadEventRepository.update(updated)

    const activityType = (STATUS_TO_ACTIVITY as any)[status]?.[event.type]
    if (activityType) {
      const activity = LeadActivity.create({
        leadId: event.leadId,
        type: activityType,
        payload: { eventId: event.id },
        createdBy,
      })
      await this.leadActivityRepository.save(activity)
    }
  }
}
