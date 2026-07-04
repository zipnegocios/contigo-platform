import { LeadMessage } from '@/core/entities/LeadMessage'

export interface LeadMessageDTO {
  id: string
  leadId: string
  authorType: 'client' | 'staff'
  authorId: string | null
  body: string
  createdAt: Date
  readAt: Date | null
}

export function toLeadMessageDTO(message: LeadMessage): LeadMessageDTO {
  return {
    id: message.id,
    leadId: message.leadId,
    authorType: message.authorType,
    authorId: message.authorId,
    body: message.body,
    createdAt: message.createdAt,
    readAt: message.readAt,
  }
}
