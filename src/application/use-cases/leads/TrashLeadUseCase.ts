import { Lead } from '@/core/entities/Lead'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'

export class TrashLeadUseCase {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(leadId: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    const trashed = lead.trash()
    await this.leadRepository.update(trashed)
    return trashed
  }
}
