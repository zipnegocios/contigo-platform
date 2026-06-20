import { LeadDocument } from '@/core/entities/LeadDocument'

export interface ILeadDocumentRepository {
  save(document: LeadDocument): Promise<void>
  findByLeadId(leadId: string): Promise<LeadDocument[]>
}
