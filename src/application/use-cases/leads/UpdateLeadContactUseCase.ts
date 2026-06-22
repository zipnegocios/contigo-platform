import { LeadContact } from '@/core/entities/LeadContact'
import { ILeadContactRepository } from '@/core/repositories/ILeadContactRepository'

export class UpdateLeadContactUseCase {
  constructor(private leadContactRepository: ILeadContactRepository) {}

  async execute(
    contactId: string,
    input: { name?: string; phone?: string; email?: string | null; roleId?: string | null },
  ): Promise<LeadContact> {
    const contact = await this.leadContactRepository.findById(contactId)
    if (!contact) throw new Error('Lead contact not found')

    const updated = contact.withDetails(input)
    await this.leadContactRepository.update(updated)
    return updated
  }
}
