import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'
import { IAuthTokenRepository } from '@/core/repositories/IAuthTokenRepository'
import { IEmailService } from '@/core/services/IEmailService'
import { AuthTokenService } from '@/infrastructure/services/AuthTokenService'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { logSecurityEventSafely } from '@/infrastructure/auth/logSecurityEvent'
import { SECURITY_EVENT_TYPES } from '@/infrastructure/auth/securityEventTypes'

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000

export class RequestPasswordResetUseCase {
  constructor(
    private adminUserRepository: IAdminUserRepository,
    private authTokenRepository: IAuthTokenRepository,
    private emailService: IEmailService,
    private authTokenService: AuthTokenService,
    private resetUrlBase: string,
    private securityEventLogger?: ISecurityEventLogger,
  ) {}

  /**
   * Always resolves the same way regardless of whether the email exists —
   * anti-enumeration. Callers must not branch on the result to shape the
   * HTTP response.
   */
  async execute(email: string): Promise<void> {
    const user = await this.adminUserRepository.findByEmail(email)
    if (!user || !user.isActive) return

    await this.authTokenRepository.invalidateAllUnused(user.id, 'password_reset')

    const { plainToken, tokenHash } = this.authTokenService.generate()
    await this.authTokenRepository.create({
      userId: user.id,
      type: 'password_reset',
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    })

    const resetUrl = `${this.resetUrlBase}?token=${plainToken}`
    await this.emailService.sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl })

    if (this.securityEventLogger) {
      await logSecurityEventSafely(this.securityEventLogger, {
        eventType: SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUESTED,
        actorId: user.id,
        payload: {},
      })
    }
  }
}
