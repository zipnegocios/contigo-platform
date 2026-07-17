import bcryptjs from 'bcryptjs'
import { randomBytes } from 'crypto'
import { AdminUser, AdminRole } from '@/core/entities/AdminUser'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'
import { IAuthTokenRepository } from '@/core/repositories/IAuthTokenRepository'
import { IEmailService } from '@/core/services/IEmailService'
import { AuthTokenService } from '@/infrastructure/services/AuthTokenService'
import { BCRYPT_COST } from '@/infrastructure/auth/constants'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { logSecurityEventSafely } from '@/infrastructure/auth/logSecurityEvent'
import { SECURITY_EVENT_TYPES } from '@/infrastructure/auth/securityEventTypes'

const INVITATION_TOKEN_TTL_MS = 72 * 60 * 60 * 1000

export interface CreateStaffUserInput {
  email: string
  name: string
  role?: AdminRole
  title?: string | null
  phone?: string | null
}

export class CreateStaffUserUseCase {
  constructor(
    private adminUserRepository: IAdminUserRepository,
    private authTokenRepository: IAuthTokenRepository,
    private emailService: IEmailService,
    private authTokenService: AuthTokenService,
    private inviteUrlBase: string,
    private securityEventLogger?: ISecurityEventLogger,
    private invitedBy?: string | null,
  ) {}

  async execute(input: CreateStaffUserInput): Promise<AdminUser> {
    const existing = await this.adminUserRepository.findByEmail(input.email)
    if (existing) throw new Error('Email already in use')

    // Sentinel hash the user can never authenticate with — the account only
    // becomes usable once they accept the invitation and set a real password.
    const sentinelHash = await bcryptjs.hash(randomBytes(32).toString('hex'), BCRYPT_COST)

    const user = AdminUser.create({
      email: input.email,
      passwordHash: sentinelHash,
      name: input.name,
      role: input.role,
      title: input.title,
      phone: input.phone,
    })

    await this.adminUserRepository.save(user)
    await this.sendInvitation(user)
    return user
  }

  async sendInvitation(user: AdminUser): Promise<void> {
    await this.authTokenRepository.invalidateAllUnused(user.id, 'invitation')

    const { plainToken, tokenHash } = this.authTokenService.generate()
    await this.authTokenRepository.create({
      userId: user.id,
      type: 'invitation',
      tokenHash,
      expiresAt: new Date(Date.now() + INVITATION_TOKEN_TTL_MS),
    })

    const inviteUrl = `${this.inviteUrlBase}?token=${plainToken}`
    await this.emailService.sendStaffInvitationEmail({ to: user.email, name: user.name, inviteUrl })

    if (this.securityEventLogger) {
      await logSecurityEventSafely(this.securityEventLogger, {
        eventType: SECURITY_EVENT_TYPES.INVITATION_SENT,
        actorId: this.invitedBy ?? null,
        payload: { invitedUserId: user.id, email: user.email },
      })
    }
  }
}
