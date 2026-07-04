export interface CreateLeadMessageInput {
  leadId: string
  authorType: 'client' | 'staff'
  authorId?: string
  body: string
}

export class LeadMessage {
  readonly id: string
  readonly leadId: string
  readonly authorType: 'client' | 'staff'
  readonly authorId: string | null
  readonly body: string
  readonly createdAt: Date
  readonly readAt: Date | null

  private constructor(props: {
    id: string
    leadId: string
    authorType: 'client' | 'staff'
    authorId: string | null
    body: string
    createdAt: Date
    readAt: Date | null
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.authorType = props.authorType
    this.authorId = props.authorId
    this.body = props.body
    this.createdAt = props.createdAt
    this.readAt = props.readAt
  }

  static create(input: CreateLeadMessageInput): LeadMessage {
    return new LeadMessage({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      authorType: input.authorType,
      authorId: input.authorId ?? null,
      body: input.body,
      createdAt: new Date(),
      readAt: null,
    })
  }

  markRead(): LeadMessage {
    return new LeadMessage({ ...this, readAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    authorType: 'client' | 'staff'
    authorId: string | null
    body: string
    createdAt: Date
    readAt: Date | null
  }): LeadMessage {
    return new LeadMessage(props)
  }
}
