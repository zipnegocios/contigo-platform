export type LeadEventType = 'call' | 'site_visit' | 'meeting'
export type LeadEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface CreateLeadEventInput {
  leadId: string
  type: LeadEventType
  scheduledAt: Date
  durationMinutes?: number
  location?: string
  notes?: string
  createdBy?: string
}

export class LeadEvent {
  readonly id: string
  readonly leadId: string
  readonly type: LeadEventType
  readonly scheduledAt: Date
  readonly durationMinutes: number
  readonly status: LeadEventStatus
  readonly location: string | null
  readonly notes: string | null
  readonly createdBy: string | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    leadId: string
    type: LeadEventType
    scheduledAt: Date
    durationMinutes: number
    status: LeadEventStatus
    location: string | null
    notes: string | null
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.type = props.type
    this.scheduledAt = props.scheduledAt
    this.durationMinutes = props.durationMinutes
    this.status = props.status
    this.location = props.location
    this.notes = props.notes
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateLeadEventInput): LeadEvent {
    const now = new Date()
    return new LeadEvent({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      type: input.type,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes ?? 30,
      status: 'scheduled',
      location: input.location ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  withStatus(status: LeadEventStatus): LeadEvent {
    return new LeadEvent({ ...this, status, updatedAt: new Date() })
  }

  withNotes(notes: string): LeadEvent {
    return new LeadEvent({ ...this, notes, updatedAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    type: LeadEventType
    scheduledAt: Date
    durationMinutes: number
    status: LeadEventStatus
    location: string | null
    notes: string | null
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
  }): LeadEvent {
    return new LeadEvent(props)
  }
}
