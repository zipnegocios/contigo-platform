import { IPermissionRepository } from '@/core/repositories/IPermissionRepository'

export class SetStaffPermissionsUseCase {
  constructor(private permissionRepository: IPermissionRepository) {}

  async execute(userId: string, permissionKeys: string[]): Promise<void> {
    await this.permissionRepository.setForUser(userId, permissionKeys)
  }
}
