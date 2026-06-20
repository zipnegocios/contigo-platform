import { LeadNote } from '../entities/LeadNote'

export interface ILeadNoteRepository {
  save(note: LeadNote): Promise<void>
  findById(id: string): Promise<LeadNote | null>
  findByLeadId(leadId: string): Promise<LeadNote[]>
  update(note: LeadNote): Promise<void>
}
