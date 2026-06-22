import { AdminUser } from '@/core/entities/AdminUser'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'

export class DeactivateStaffUserUseCase {
  constructor(private adminUserRepository: IAdminUserRepository) {}

  async execute(userId: string, isActive: boolean): Promise<AdminUser> {
    const user = await this.adminUserRepository.findById(userId)
    if (!user) throw new Error('Staff user not found')

    const updated = isActive ? user.activate() : user.deactivate()
    await this.adminUserRepository.update(updated)
    return updated
  }
}
