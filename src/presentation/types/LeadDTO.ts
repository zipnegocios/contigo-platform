import { Lead, LeadStage } from '@/core/entities/Lead'

export interface LeadDTO {
  id: string
  quoteId: string
  stage: LeadStage
  estimatedValue: number | null
  updatedAt: Date
  archivedAt: Date | null
  trashedAt: Date | null
}

export function toLeadDTO(lead: Lead): LeadDTO {
  return {
    id: lead.id,
    quoteId: lead.quoteId,
    stage: lead.stage,
    estimatedValue: lead.estimatedValue,
    updatedAt: lead.updatedAt,
    archivedAt: lead.archivedAt,
    trashedAt: lead.trashedAt,
  }
}
