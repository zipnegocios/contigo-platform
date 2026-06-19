import { LeadActivity } from '@/core/entities/LeadActivity'

export interface ILeadActivityRepository {
  save(activity: LeadActivity): Promise<void>
  findByLeadId(leadId: string): Promise<LeadActivity[]>
}
