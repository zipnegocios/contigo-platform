import { LeadEvent, LeadEventType, LeadEventStatus } from '@/core/entities/LeadEvent'

export interface LeadEventDTO {
  id: string
  leadId: string
  type: LeadEventType
  scheduledAt: Date
  durationMinutes: number
  status: LeadEventStatus
  location: string | null
  notes: string | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export function toLeadEventDTO(event: LeadEvent): LeadEventDTO {
  return {
    id: event.id,
    leadId: event.leadId,
    type: event.type,
    scheduledAt: event.scheduledAt,
    durationMinutes: event.durationMinutes,
    status: event.status,
    location: event.location,
    notes: event.notes,
    createdBy: event.createdBy,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}
