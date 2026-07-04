import { LeadMessage } from '@/core/entities/LeadMessage'

export interface PublicMessageDTO {
  id: string
  authorType: string
  body: string
  createdAt: Date
}

export function toPublicMessageDTO(message: LeadMessage): PublicMessageDTO {
  return {
    id: message.id,
    authorType: message.authorType,
    body: message.body,
    createdAt: message.createdAt,
  }
}
