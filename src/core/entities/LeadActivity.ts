export type LeadActivityType =
  | 'stage_change'
  | 'note'
  | 'call_scheduled'
  | 'call_completed'
  | 'call_cancelled'
  | 'visit_scheduled'
  | 'visit_completed'
  | 'visit_cancelled'
  | 'event_scheduled'
  | 'event_completed'
  | 'event_cancelled'
  | 'document_uploaded'
  | 'document_sent'
  | 'email_sent'
  | 'quote_status_changed'

export interface CreateLeadActivityInput {
  leadId: string
  type: LeadActivityType
  payload?: Record<string, unknown>
  createdBy?: string
}

export class LeadActivity {
  readonly id: string
  readonly leadId: string
  readonly type: LeadActivityType
  readonly payload: Record<string, unknown>
  readonly createdBy: string | null
  readonly createdAt: Date

  private constructor(props: {
    id: string
    leadId: string
    type: LeadActivityType
    payload: Record<string, unknown>
    createdBy: string | null
    createdAt: Date
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.type = props.type
    this.payload = props.payload
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
  }

  static create(input: CreateLeadActivityInput): LeadActivity {
    return new LeadActivity({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      type: input.type,
      payload: input.payload ?? {},
      createdBy: input.createdBy ?? null,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    type: LeadActivityType
    payload: Record<string, unknown>
    createdBy: string | null
    createdAt: Date
  }): LeadActivity {
    return new LeadActivity(props)
  }
}
