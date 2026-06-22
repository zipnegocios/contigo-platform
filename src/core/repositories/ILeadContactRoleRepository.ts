import { LeadContactRole } from '../entities/LeadContactRole'

export interface ILeadContactRoleRepository {
  findAll(): Promise<LeadContactRole[]>
  findByKey(key: string): Promise<LeadContactRole | null>
  findById(id: string): Promise<LeadContactRole | null>
  create(input: { key: string; label: string }): Promise<LeadContactRole>
}
