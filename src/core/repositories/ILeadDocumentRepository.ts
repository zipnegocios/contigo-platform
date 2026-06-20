import { LeadDocument } from '@/core/entities/LeadDocument'

export interface ILeadDocumentRepository {
  save(document: LeadDocument): Promise<void>
  findById(id: string): Promise<LeadDocument | null>
  findByLeadId(leadId: string): Promise<LeadDocument[]>
  update(document: LeadDocument): Promise<void>
}
