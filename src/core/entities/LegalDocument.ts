export type LegalDocumentStatus = 'draft' | 'in_review' | 'published' | 'archived'
export type LegalDomain = 'website' | 'service' | 'general'

export interface CreateLegalDocumentDraftInput {
  slug: string
  domain: LegalDomain
  title: string
  content: string
  effectiveDate?: Date | null
  createdBy: string | null
  version: number
}

export class LegalDocumentNotEditableError extends Error {
  constructor(id: string, status: LegalDocumentStatus) {
    super(`Legal document ${id} is ${status} and cannot be edited`)
    this.name = 'LegalDocumentNotEditableError'
  }
}

export class LegalDocumentNotPublishableError extends Error {
  constructor(id: string, status: LegalDocumentStatus) {
    super(`Legal document ${id} is ${status} and cannot be published`)
    this.name = 'LegalDocumentNotPublishableError'
  }
}

export class LegalDocument {
  readonly id: string
  readonly slug: string
  readonly domain: LegalDomain
  readonly title: string
  readonly content: string
  readonly contentHash: string | null
  readonly version: number
  readonly status: LegalDocumentStatus
  readonly effectiveDate: Date | null
  readonly publishedAt: Date | null
  readonly publishedBy: string | null
  readonly createdBy: string | null
  readonly reviewNote: string | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    domain: LegalDomain
    title: string
    content: string
    contentHash: string | null
    version: number
    status: LegalDocumentStatus
    effectiveDate: Date | null
    publishedAt: Date | null
    publishedBy: string | null
    createdBy: string | null
    reviewNote: string | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.domain = props.domain
    this.title = props.title
    this.content = props.content
    this.contentHash = props.contentHash
    this.version = props.version
    this.status = props.status
    this.effectiveDate = props.effectiveDate
    this.publishedAt = props.publishedAt
    this.publishedBy = props.publishedBy
    this.createdBy = props.createdBy
    this.reviewNote = props.reviewNote
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  get isEditable(): boolean {
    return this.status === 'draft' || this.status === 'in_review'
  }

  static createDraft(input: CreateLegalDocumentDraftInput): LegalDocument {
    const now = new Date()
    return new LegalDocument({
      id: crypto.randomUUID(),
      slug: input.slug,
      domain: input.domain,
      title: input.title.trim(),
      content: input.content,
      contentHash: null,
      version: input.version,
      status: 'draft',
      effectiveDate: input.effectiveDate ?? null,
      publishedAt: null,
      publishedBy: null,
      createdBy: input.createdBy,
      reviewNote: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Content edits (title/content/effectiveDate). Only draft/in_review rows
  // may be edited — published/archived rows are immutable (repository
  // guard enforces this again at the DB layer as the source of truth).
  withEdits(partial: { title?: string; content?: string; effectiveDate?: Date | null }): LegalDocument {
    if (!this.isEditable) {
      throw new LegalDocumentNotEditableError(this.id, this.status)
    }
    return new LegalDocument({
      ...this,
      title: partial.title !== undefined ? partial.title.trim() : this.title,
      content: partial.content !== undefined ? partial.content : this.content,
      effectiveDate: partial.effectiveDate !== undefined ? partial.effectiveDate : this.effectiveDate,
      updatedAt: new Date(),
    })
  }

  submitForReview(reviewNote?: string | null): LegalDocument {
    if (this.status !== 'draft') {
      throw new LegalDocumentNotEditableError(this.id, this.status)
    }
    return new LegalDocument({
      ...this,
      status: 'in_review',
      reviewNote: reviewNote ?? this.reviewNote,
      updatedAt: new Date(),
    })
  }

  publish(params: { contentHash: string; publishedBy: string; reviewNote?: string | null }): LegalDocument {
    if (this.status !== 'draft' && this.status !== 'in_review') {
      throw new LegalDocumentNotPublishableError(this.id, this.status)
    }
    const now = new Date()
    return new LegalDocument({
      ...this,
      status: 'published',
      contentHash: params.contentHash,
      publishedAt: now,
      publishedBy: params.publishedBy,
      reviewNote: params.reviewNote ?? this.reviewNote,
      effectiveDate: this.effectiveDate ?? now,
      updatedAt: now,
    })
  }

  archive(): LegalDocument {
    return new LegalDocument({ ...this, status: 'archived', updatedAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    slug: string
    domain: LegalDomain
    title: string
    content: string
    contentHash: string | null
    version: number
    status: LegalDocumentStatus
    effectiveDate: Date | null
    publishedAt: Date | null
    publishedBy: string | null
    createdBy: string | null
    reviewNote: string | null
    createdAt: Date
    updatedAt: Date
  }): LegalDocument {
    return new LegalDocument(props)
  }
}
