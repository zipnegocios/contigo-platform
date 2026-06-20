import { Lead, LeadStage } from '@/core/entities/Lead'

export interface LeadDTO {
  id: string
  quoteId: string
  stage: LeadStage
  adminNotes: string | null
  estimatedValue: number | null
  updatedAt: Date
}

export function toLeadDTO(lead: Lead): LeadDTO {
  return {
    id: lead.id,
    quoteId: lead.quoteId,
    stage: lead.stage,
    adminNotes: lead.adminNotes,
    estimatedValue: lead.estimatedValue,
    updatedAt: lead.updatedAt,
  }
}
