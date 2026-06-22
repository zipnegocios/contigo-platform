import { LeadContactRole } from '@/core/entities/LeadContactRole'

export interface LeadContactRoleDTO {
  id: string
  key: string
  label: string
  isDefault: boolean
  createdAt: Date
}

export function toLeadContactRoleDTO(role: LeadContactRole): LeadContactRoleDTO {
  return {
    id: role.id,
    key: role.key,
    label: role.label,
    isDefault: role.isDefault,
    createdAt: role.createdAt,
  }
}
