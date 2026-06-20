export type LeadDocumentDirection = 'client_upload' | 'admin_sent' | 'internal'
export type LeadDocumentCategory = 'reference_photo' | 'site_photo' | 'quote_pdf' | 'contract' | 'other'

export interface CreateLeadDocumentInput {
  leadId: string
  fileKey: string
  fileName: string
  mimeType?: string
  direction: LeadDocumentDirection
  category?: LeadDocumentCategory
  sourceMediaId?: string
  uploadedBy?: string
}

export class LeadDocument {
  readonly id: string
  readonly leadId: string
  readonly fileKey: string
  readonly fileName: string
  readonly mimeType: string | null
  readonly direction: LeadDocumentDirection
  readonly category: LeadDocumentCategory
  readonly sourceMediaId: string | null
  readonly uploadedBy: string | null
  readonly createdAt: Date

  private constructor(props: {
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
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.fileKey = props.fileKey
    this.fileName = props.fileName
    this.mimeType = props.mimeType
    this.direction = props.direction
    this.category = props.category
    this.sourceMediaId = props.sourceMediaId
    this.uploadedBy = props.uploadedBy
    this.createdAt = props.createdAt
  }

  static create(input: CreateLeadDocumentInput): LeadDocument {
    return new LeadDocument({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      fileKey: input.fileKey,
      fileName: input.fileName,
      mimeType: input.mimeType ?? null,
      direction: input.direction,
      category: input.category ?? 'other',
      sourceMediaId: input.sourceMediaId ?? null,
      uploadedBy: input.uploadedBy ?? null,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: {
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
  }): LeadDocument {
    return new LeadDocument(props)
  }
}
