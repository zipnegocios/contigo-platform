import { LeadEvent } from '@/core/entities/LeadEvent'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'

export class ArchiveLeadEventUseCase {
  constructor(private leadEventRepository: ILeadEventRepository) {}

  async execute(eventId: string): Promise<LeadEvent> {
    const event = await this.leadEventRepository.findById(eventId)
    if (!event) throw new Error('Lead event not found')

    const archived = event.archive()
    await this.leadEventRepository.update(archived)
    return archived
  }
}
