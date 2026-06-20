import { LeadEvent, LeadEventMetadata } from '@/core/entities/LeadEvent'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'

export class UpdateLeadEventUseCase {
  constructor(private leadEventRepository: ILeadEventRepository) {}

  async execute(
    eventId: string,
    input: { scheduledAt?: Date; durationMinutes?: number; notes?: string | null; metadata?: LeadEventMetadata },
  ): Promise<LeadEvent> {
    const event = await this.leadEventRepository.findById(eventId)
    if (!event) throw new Error('Lead event not found')

    let updated = event.withDetails({
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
    })
    if (input.metadata) {
      updated = updated.withMetadata(input.metadata)
    }
    await this.leadEventRepository.update(updated)
    return updated
  }
}
