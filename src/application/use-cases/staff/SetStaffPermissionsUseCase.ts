import { IPermissionRepository } from '@/core/repositories/IPermissionRepository'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { logSecurityEventSafely } from '@/infrastructure/auth/logSecurityEvent'
import { SECURITY_EVENT_TYPES } from '@/infrastructure/auth/securityEventTypes'

export class SetStaffPermissionsUseCase {
  constructor(
    private permissionRepository: IPermissionRepository,
    private securityEventLogger?: ISecurityEventLogger,
    private actorId?: string | null,
  ) {}

  async execute(userId: string, permissionKeys: string[]): Promise<void> {
    await this.permissionRepository.setForUser(userId, permissionKeys)

    if (this.securityEventLogger) {
      await logSecurityEventSafely(this.securityEventLogger, {
        eventType: SECURITY_EVENT_TYPES.PERMISSIONS_CHANGED,
        actorId: this.actorId ?? null,
        payload: { targetUserId: userId, permissionKeys },
      })
    }
  }
}
