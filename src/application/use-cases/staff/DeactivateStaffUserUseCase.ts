import { AdminUser } from '@/core/entities/AdminUser'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { logSecurityEventSafely } from '@/infrastructure/auth/logSecurityEvent'
import { SECURITY_EVENT_TYPES } from '@/infrastructure/auth/securityEventTypes'

export class DeactivateStaffUserUseCase {
  constructor(
    private adminUserRepository: IAdminUserRepository,
    private securityEventLogger?: ISecurityEventLogger,
    private actorId?: string | null,
  ) {}

  async execute(userId: string, isActive: boolean): Promise<AdminUser> {
    const user = await this.adminUserRepository.findById(userId)
    if (!user) throw new Error('Staff user not found')

    const updated = isActive ? user.activate() : user.deactivate()
    await this.adminUserRepository.update(updated)

    if (this.securityEventLogger) {
      await logSecurityEventSafely(this.securityEventLogger, {
        eventType: isActive ? SECURITY_EVENT_TYPES.USER_REACTIVATED : SECURITY_EVENT_TYPES.USER_DEACTIVATED,
        actorId: this.actorId ?? null,
        payload: { targetUserId: userId },
      })
    }

    return updated
  }
}
