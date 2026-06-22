import { LeadContact } from '@/core/entities/LeadContact'

export interface LeadContactDTO {
  id: string
  leadId: string
  name: string
  phone: string
  email: string | null
  roleId: string | null
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

export function toLeadContactDTO(contact: LeadContact): LeadContactDTO {
  return {
    id: contact.id,
    leadId: contact.leadId,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    roleId: contact.roleId,
    isPrimary: contact.isPrimary,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    archivedAt: contact.archivedAt,
  }
}
