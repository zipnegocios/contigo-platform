import { LeadMessage } from '../entities/LeadMessage'

export interface ILeadMessageRepository {
  save(message: LeadMessage): Promise<void>
  findByLeadId(leadId: string): Promise<LeadMessage[]>
  countUnread(leadId: string, authorType: 'client' | 'staff'): Promise<number>
  countUnreadGroupedByLead(authorType: 'client' | 'staff'): Promise<Record<string, number>>
  markAsRead(leadId: string, authorType: 'client' | 'staff'): Promise<void>
}
