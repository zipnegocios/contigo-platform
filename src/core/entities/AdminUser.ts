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
  readonly sessionVersion: number
  readonly failedLoginCount: number
  readonly lockedUntil: Date | null
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
    sessionVersion: number
    failedLoginCount: number
    lockedUntil: Date | null
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
    this.sessionVersion = props.sessionVersion
    this.failedLoginCount = props.failedLoginCount
    this.lockedUntil = props.lockedUntil
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
      sessionVersion: 1,
      failedLoginCount: 0,
      lockedUntil: null,
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
    return new AdminUser({
      ...this,
      isActive: false,
      sessionVersion: this.sessionVersion + 1,
      updatedAt: new Date(),
    })
  }

  activate(): AdminUser {
    return new AdminUser({ ...this, isActive: true, updatedAt: new Date() })
  }

  /** Sets a new password hash and invalidates every outstanding session for this user. */
  withPasswordHash(passwordHash: string): AdminUser {
    return new AdminUser({
      ...this,
      passwordHash,
      sessionVersion: this.sessionVersion + 1,
      updatedAt: new Date(),
    })
  }

  /**
   * Transparent bcrypt-cost upgrade after a successful login with the same
   * (already-verified) plaintext password. Must NOT bump `sessionVersion` —
   * that would invalidate the very session currently being established.
   */
  withRehashedPassword(passwordHash: string): AdminUser {
    return new AdminUser({ ...this, passwordHash, updatedAt: new Date() })
  }

  withIncrementedSessionVersion(): AdminUser {
    return new AdminUser({ ...this, sessionVersion: this.sessionVersion + 1, updatedAt: new Date() })
  }

  withSuccessfulLogin(): AdminUser {
    const now = new Date()
    return new AdminUser({
      ...this,
      lastLogin: now,
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: now,
    })
  }

  /**
   * Records a wrong-password attempt. At `lockoutThreshold` failures, locks
   * the account for `lockoutDurationMs` and resets the counter — the lockout
   * itself is never revealed to the caller (same generic error either way).
   */
  withFailedLoginAttempt(lockoutThreshold: number, lockoutDurationMs: number): AdminUser {
    const nextCount = this.failedLoginCount + 1
    const shouldLock = nextCount >= lockoutThreshold
    return new AdminUser({
      ...this,
      failedLoginCount: shouldLock ? 0 : nextCount,
      lockedUntil: shouldLock ? new Date(Date.now() + lockoutDurationMs) : this.lockedUntil,
      updatedAt: new Date(),
    })
  }

  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil.getTime() > Date.now()
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
    sessionVersion: number
    failedLoginCount: number
    lockedUntil: Date | null
    createdAt: Date
    updatedAt: Date
  }): AdminUser {
    return new AdminUser(props)
  }
}
