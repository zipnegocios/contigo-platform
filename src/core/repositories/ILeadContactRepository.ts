import { LeadContact } from '../entities/LeadContact'

export interface ILeadContactRepository {
  save(contact: LeadContact): Promise<void>
  findById(id: string): Promise<LeadContact | null>
  findByLeadId(leadId: string): Promise<LeadContact[]>
  update(contact: LeadContact): Promise<void>
}
