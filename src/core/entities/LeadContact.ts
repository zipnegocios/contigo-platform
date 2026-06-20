export type LeadContactRole = 'owner' | 'site_manager' | 'spouse' | 'other'

export interface CreateLeadContactInput {
  leadId: string
  name: string
  phone: string
  email?: string
  role?: LeadContactRole
  isPrimary?: boolean
}

export class LeadContact {
  readonly id: string
  readonly leadId: string
  readonly name: string
  readonly phone: string
  readonly email: string | null
  readonly role: LeadContactRole | null
  readonly isPrimary: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly archivedAt: Date | null

  private constructor(props: {
    id: string
    leadId: string
    name: string
    phone: string
    email: string | null
    role: LeadContactRole | null
    isPrimary: boolean
    createdAt: Date
    updatedAt: Date
    archivedAt: Date | null
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.name = props.name
    this.phone = props.phone
    this.email = props.email
    this.role = props.role
    this.isPrimary = props.isPrimary
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.archivedAt = props.archivedAt
  }

  static create(input: CreateLeadContactInput): LeadContact {
    const now = new Date()
    return new LeadContact({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      role: input.role ?? null,
      isPrimary: input.isPrimary ?? false,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    })
  }

  withDetails(input: { name?: string; phone?: string; email?: string | null; role?: LeadContactRole | null }): LeadContact {
    return new LeadContact({
      ...this,
      name: input.name ?? this.name,
      phone: input.phone ?? this.phone,
      email: input.email !== undefined ? input.email : this.email,
      role: input.role !== undefined ? input.role : this.role,
      updatedAt: new Date(),
    })
  }

  archive(): LeadContact {
    return new LeadContact({ ...this, archivedAt: new Date() })
  }

  restore(): LeadContact {
    return new LeadContact({ ...this, archivedAt: null })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    name: string
    phone: string
    email: string | null
    role: LeadContactRole | null
    isPrimary: boolean
    createdAt: Date
    updatedAt: Date
    archivedAt: Date | null
  }): LeadContact {
    return new LeadContact(props)
  }
}
