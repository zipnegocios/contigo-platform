export interface CreateLeadContactRoleInput {
  key: string
  label: string
  isDefault?: boolean
}

export class LeadContactRole {
  readonly id: string
  readonly key: string
  readonly label: string
  readonly isDefault: boolean
  readonly createdAt: Date

  private constructor(props: {
    id: string
    key: string
    label: string
    isDefault: boolean
    createdAt: Date
  }) {
    this.id = props.id
    this.key = props.key
    this.label = props.label
    this.isDefault = props.isDefault
    this.createdAt = props.createdAt
  }

  static create(input: CreateLeadContactRoleInput): LeadContactRole {
    return new LeadContactRole({
      id: crypto.randomUUID(),
      key: input.key,
      label: input.label,
      isDefault: input.isDefault ?? false,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    key: string
    label: string
    isDefault: boolean
    createdAt: Date
  }): LeadContactRole {
    return new LeadContactRole(props)
  }
}
