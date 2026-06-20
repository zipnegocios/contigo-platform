import { LeadContact, LeadContactRole } from '@/core/entities/LeadContact'
import { ILeadContactRepository } from '@/core/repositories/ILeadContactRepository'

export class CreateLeadContactUseCase {
  constructor(private leadContactRepository: ILeadContactRepository) {}

  async execute(input: {
    leadId: string
    name: string
    phone: string
    email?: string
    role?: LeadContactRole
    isPrimary?: boolean
  }): Promise<LeadContact> {
    const contact = LeadContact.create(input)
    await this.leadContactRepository.save(contact)
    return contact
  }
}
