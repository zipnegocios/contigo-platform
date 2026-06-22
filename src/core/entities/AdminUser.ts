export type AdminRole = 'owner' | 'staff'

export interface CreateAdminUserInput {
  email: string
  passwordHash: string
  name: string
  role?: AdminRole
  title?: string | null
  phone?: string | null
}

export class AdminUser {
  readonly id: string
  readonly email: string
  readonly passwordHash: string
  readonly name: string
  readonly role: AdminRole
  readonly title: string | null
  readonly phone: string | null
  readonly isActive: boolean
  readonly lastLogin: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    email: string
    passwordHash: string
    name: string
    role: AdminRole
    title: string | null
    phone: string | null
    isActive: boolean
    lastLogin: Date | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.email = props.email
    this.passwordHash = props.passwordHash
    this.name = props.name
    this.role = props.role
    this.title = props.title
    this.phone = props.phone
    this.isActive = props.isActive
    this.lastLogin = props.lastLogin
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  /**
   * `passwordHash` must already be hashed (bcryptjs) by the caller — hashing
   * is an infrastructure concern and stays out of this entity. See
   * CreateStaffUserUseCase for where the hash happens before this is called.
   */
  static create(input: CreateAdminUserInput): AdminUser {
    const now = new Date()
    return new AdminUser({
      id: crypto.randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role ?? 'staff',
      title: input.title ?? null,
      phone: input.phone ?? null,
      isActive: true,
      lastLogin: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  withProfile(input: { name?: string; title?: string | null; phone?: string | null }): AdminUser {
    return new AdminUser({
      ...this,
      name: input.name ?? this.name,
      title: input.title !== undefined ? input.title : this.title,
      phone: input.phone !== undefined ? input.phone : this.phone,
      updatedAt: new Date(),
    })
  }

  deactivate(): AdminUser {
    return new AdminUser({ ...this, isActive: false, updatedAt: new Date() })
  }

  activate(): AdminUser {
    return new AdminUser({ ...this, isActive: true, updatedAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    email: string
    passwordHash: string
    name: string
    role: AdminRole
    title: string | null
    phone: string | null
    isActive: boolean
    lastLogin: Date | null
    createdAt: Date
    updatedAt: Date
  }): AdminUser {
    return new AdminUser(props)
  }
}
