import { Lead } from '@/core/entities/Lead'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'

export class RestoreLeadFromTrashUseCase {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(leadId: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    const restored = lead.restoreFromTrash()
    await this.leadRepository.update(restored)
    return restored
  }
}
