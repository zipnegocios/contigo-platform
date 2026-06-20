import { LeadDocument, LeadDocumentDirection, LeadDocumentCategory } from '@/core/entities/LeadDocument'

export interface LeadDocumentDTO {
  id: string
  leadId: string
  fileKey: string
  fileName: string
  mimeType: string | null
  direction: LeadDocumentDirection
  category: LeadDocumentCategory
  sourceMediaId: string | null
  uploadedBy: string | null
  createdAt: Date
}

export function toLeadDocumentDTO(document: LeadDocument): LeadDocumentDTO {
  return {
    id: document.id,
    leadId: document.leadId,
    fileKey: document.fileKey,
    fileName: document.fileName,
    mimeType: document.mimeType,
    direction: document.direction,
    category: document.category,
    sourceMediaId: document.sourceMediaId,
    uploadedBy: document.uploadedBy,
    createdAt: document.createdAt,
  }
}
