export type LeadEventType = 'call' | 'site_visit' | 'meeting'
export type LeadEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type LeadEventMetadata =
  | { kind: 'call'; contactId: string | null }
  | { kind: 'site_visit'; contactId: string | null; mapsLink: string | null; address: string | null; referencePoint: string | null }
  | { kind: 'meeting'; channel: 'google_meet' | 'zoom' | 'teams' | 'whatsapp' | 'other'; link: string | null }

export interface CreateLeadEventInput {
  leadId: string
  type: LeadEventType
  scheduledAt: Date
  durationMinutes?: number
  location?: string
  notes?: string
  createdBy?: string
  metadata: LeadEventMetadata
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
  readonly metadata: LeadEventMetadata
  readonly archivedAt: Date | null

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
    metadata: LeadEventMetadata
    archivedAt: Date | null
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
    this.metadata = props.metadata
    this.archivedAt = props.archivedAt
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
      metadata: input.metadata,
      archivedAt: null,
    })
  }

  withStatus(status: LeadEventStatus): LeadEvent {
    return new LeadEvent({ ...this, status, updatedAt: new Date() })
  }

  withNotes(notes: string): LeadEvent {
    return new LeadEvent({ ...this, notes, updatedAt: new Date() })
  }

  withMetadata(metadata: LeadEventMetadata): LeadEvent {
    return new LeadEvent({ ...this, metadata, updatedAt: new Date() })
  }

  withDetails(input: { scheduledAt?: Date; durationMinutes?: number; notes?: string | null }): LeadEvent {
    return new LeadEvent({
      ...this,
      scheduledAt: input.scheduledAt ?? this.scheduledAt,
      durationMinutes: input.durationMinutes ?? this.durationMinutes,
      notes: input.notes !== undefined ? input.notes : this.notes,
      updatedAt: new Date(),
    })
  }

  archive(): LeadEvent {
    return new LeadEvent({ ...this, archivedAt: new Date() })
  }

  restore(): LeadEvent {
    return new LeadEvent({ ...this, archivedAt: null })
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
    metadata: LeadEventMetadata
    archivedAt: Date | null
  }): LeadEvent {
    return new LeadEvent(props)
  }
}
