import bcryptjs from 'bcryptjs'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'
import { IAuthTokenRepository } from '@/core/repositories/IAuthTokenRepository'
import { AuthTokenService } from '@/infrastructure/services/AuthTokenService'
import { passwordPolicySchema } from '@/presentation/lib/passwordPolicy'
import { BCRYPT_COST } from '@/infrastructure/auth/constants'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { logSecurityEventSafely } from '@/infrastructure/auth/logSecurityEvent'
import { SECURITY_EVENT_TYPES } from '@/infrastructure/auth/securityEventTypes'

export class ResetPasswordUseCase {
  constructor(
    private adminUserRepository: IAdminUserRepository,
    private authTokenRepository: IAuthTokenRepository,
    private authTokenService: AuthTokenService,
    private securityEventLogger?: ISecurityEventLogger,
  ) {}

  async execute(plainToken: string, newPassword: string): Promise<void> {
    const parsed = passwordPolicySchema.safeParse(newPassword)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? 'Invalid password')
    }

    const tokenHash = this.authTokenService.hash(plainToken)
    const token = await this.authTokenRepository.findValidByHash(tokenHash, 'password_reset')
    if (!token) throw new Error('This reset link is invalid or has expired')

    const user = await this.adminUserRepository.findById(token.userId)
    if (!user) throw new Error('This reset link is invalid or has expired')

    const passwordHash = await bcryptjs.hash(parsed.data, BCRYPT_COST)
    await this.adminUserRepository.update(user.withPasswordHash(passwordHash))
    await this.authTokenRepository.markUsed(token.id)

    if (this.securityEventLogger) {
      await logSecurityEventSafely(this.securityEventLogger, {
        eventType: SECURITY_EVENT_TYPES.PASSWORD_RESET_COMPLETED,
        actorId: user.id,
        payload: {},
      })
    }
  }
}
