import { Lead } from '../entities/Lead'

export interface ILeadRepository {
  save(lead: Lead): Promise<void>
  findById(id: string): Promise<Lead | null>
  findByQuoteId(quoteId: string): Promise<Lead | null>
  findAll(limit?: number, offset?: number): Promise<Lead[]>
  findByStage(stage: string, limit?: number, offset?: number): Promise<Lead[]>
  update(lead: Lead): Promise<void>
}
