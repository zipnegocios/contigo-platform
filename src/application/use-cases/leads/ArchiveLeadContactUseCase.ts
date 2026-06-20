import { LeadContact } from '@/core/entities/LeadContact'
import { ILeadContactRepository } from '@/core/repositories/ILeadContactRepository'

export class ArchiveLeadContactUseCase {
  constructor(private leadContactRepository: ILeadContactRepository) {}

  async execute(contactId: string): Promise<LeadContact> {
    const contact = await this.leadContactRepository.findById(contactId)
    if (!contact) throw new Error('Lead contact not found')

    const archived = contact.archive()
    await this.leadContactRepository.update(archived)
    return archived
  }
}
