import { LeadContact, LeadContactRole } from '@/core/entities/LeadContact'

export interface LeadContactDTO {
  id: string
  leadId: string
  name: string
  phone: string
  email: string | null
  role: LeadContactRole | null
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
    role: contact.role,
    isPrimary: contact.isPrimary,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    archivedAt: contact.archivedAt,
  }
}
