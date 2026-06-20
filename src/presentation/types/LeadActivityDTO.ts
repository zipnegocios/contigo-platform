import { LeadActivity, LeadActivityType } from '@/core/entities/LeadActivity'

export interface LeadActivityDTO {
  id: string
  leadId: string
  type: LeadActivityType
  payload: Record<string, unknown>
  createdBy: string | null
  createdAt: Date
}

export function toLeadActivityDTO(activity: LeadActivity): LeadActivityDTO {
  return {
    id: activity.id,
    leadId: activity.leadId,
    type: activity.type,
    payload: activity.payload,
    createdBy: activity.createdBy,
    createdAt: activity.createdAt,
  }
}
