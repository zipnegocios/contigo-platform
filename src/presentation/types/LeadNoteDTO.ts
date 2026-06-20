import { LeadNote } from '@/core/entities/LeadNote'

export interface LeadNoteDTO {
  id: string
  leadId: string
  body: string
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

export function toLeadNoteDTO(note: LeadNote): LeadNoteDTO {
  return {
    id: note.id,
    leadId: note.leadId,
    body: note.body,
    createdBy: note.createdBy,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    archivedAt: note.archivedAt,
  }
}
