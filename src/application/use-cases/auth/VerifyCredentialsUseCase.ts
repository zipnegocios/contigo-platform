import bcryptjs from 'bcryptjs'
import { AdminUser } from '@/core/entities/AdminUser'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'
import { BCRYPT_COST } from '@/infrastructure/auth/constants'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { logSecurityEventSafely } from '@/infrastructure/auth/logSecurityEvent'
import { SECURITY_EVENT_TYPES } from '@/infrastructure/auth/securityEventTypes'

const LOCKOUT_THRESHOLD = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000
const GENERIC_ERROR = 'Invalid email or password'

// Precomputed once so a lookup for a non-existent email still spends
// roughly the same time as a real-but-wrong-password check — prevents an
// attacker from enumerating valid accounts by measuring response latency.
const DUMMY_HASH = bcryptjs.hashSync('dummy-password-for-timing-parity', BCRYPT_COST)

export interface VerifyCredentialsContext {
  ipAddress: string | null
  userAgent: string | null
}

export class VerifyCredentialsUseCase {
  constructor(
    private adminUserRepository: IAdminUserRepository,
    private securityEventLogger?: ISecurityEventLogger,
  ) {}

  async execute(email: string, password: string, context?: VerifyCredentialsContext): Promise<AdminUser> {
    const user = await this.adminUserRepository.findByEmail(email)

    if (!user) {
      await bcryptjs.compare(password, DUMMY_HASH)
      await this.logEvent(SECURITY_EVENT_TYPES.LOGIN_FAILED, null, { email, ...context })
      throw new Error(GENERIC_ERROR)
    }

    if (!user.isActive) {
      await this.logEvent(SECURITY_EVENT_TYPES.LOGIN_FAILED, user.id, { reason: 'inactive', ...context })
      throw new Error('Account is disabled')
    }

    if (user.isLocked()) {
      // Lockout is never announced — same generic error, no bcrypt spent.
      await this.logEvent(SECURITY_EVENT_TYPES.LOGIN_FAILED, user.id, { reason: 'locked', ...context })
      throw new Error(GENERIC_ERROR)
    }

    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      const updated = user.withFailedLoginAttempt(LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MS)
      await this.adminUserRepository.update(updated)
      if (updated.isLocked()) {
        await this.logEvent(SECURITY_EVENT_TYPES.ACCOUNT_LOCKED, user.id, { ...context })
      } else {
        await this.logEvent(SECURITY_EVENT_TYPES.LOGIN_FAILED, user.id, { ...context })
      }
      throw new Error(GENERIC_ERROR)
    }

    let verifiedUser = user.withSuccessfulLogin()

    // Transparent bcrypt-cost upgrade: re-hash with the plaintext password
    // just verified, without bumping sessionVersion (would invalidate the
    // session being established right now). Pre-existing users migrate on
    // their next login instead of a mass forced reset.
    if (bcryptjs.getRounds(verifiedUser.passwordHash) < BCRYPT_COST) {
      const upgradedHash = await bcryptjs.hash(password, BCRYPT_COST)
      verifiedUser = verifiedUser.withRehashedPassword(upgradedHash)
    }

    await this.adminUserRepository.update(verifiedUser)
    await this.logEvent(SECURITY_EVENT_TYPES.LOGIN_SUCCESS, verifiedUser.id, { ...context })
    return verifiedUser
  }

  private async logEvent(
    eventType: string,
    actorId: string | null,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.securityEventLogger) return
    await logSecurityEventSafely(this.securityEventLogger, {
      eventType,
      actorId,
      payload: payload ?? {},
    })
  }
}
