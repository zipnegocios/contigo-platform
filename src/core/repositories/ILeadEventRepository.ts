import { LeadEvent } from '@/core/entities/LeadEvent'

export interface ILeadEventRepository {
  save(event: LeadEvent): Promise<void>
  findById(id: string): Promise<LeadEvent | null>
  findByLeadId(leadId: string): Promise<LeadEvent[]>
  findUpcoming(from: Date, to: Date): Promise<LeadEvent[]> // para el calendario global de admin
  update(event: LeadEvent): Promise<void>
}
