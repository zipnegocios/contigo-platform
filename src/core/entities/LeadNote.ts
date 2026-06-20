export interface CreateLeadNoteInput {
  leadId: string
  body: string
  createdBy?: string
}

export class LeadNote {
  readonly id: string
  readonly leadId: string
  readonly body: string
  readonly createdBy: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly archivedAt: Date | null

  private constructor(props: {
    id: string
    leadId: string
    body: string
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
    archivedAt: Date | null
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.body = props.body
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.archivedAt = props.archivedAt
  }

  static create(input: CreateLeadNoteInput): LeadNote {
    const now = new Date()
    return new LeadNote({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      body: input.body,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    })
  }

  withBody(body: string): LeadNote {
    return new LeadNote({ ...this, body, updatedAt: new Date() })
  }

  archive(): LeadNote {
    return new LeadNote({ ...this, archivedAt: new Date() })
  }

  restore(): LeadNote {
    return new LeadNote({ ...this, archivedAt: null })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    body: string
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
    archivedAt: Date | null
  }): LeadNote {
    return new LeadNote(props)
  }
}
