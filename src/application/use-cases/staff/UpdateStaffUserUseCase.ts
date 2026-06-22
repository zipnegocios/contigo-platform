import { AdminUser } from '@/core/entities/AdminUser'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'

export interface UpdateStaffUserInput {
  name?: string
  title?: string | null
  phone?: string | null
}

export class UpdateStaffUserUseCase {
  constructor(private adminUserRepository: IAdminUserRepository) {}

  async execute(userId: string, input: UpdateStaffUserInput): Promise<AdminUser> {
    const user = await this.adminUserRepository.findById(userId)
    if (!user) throw new Error('Staff user not found')

    const updated = user.withProfile(input)
    await this.adminUserRepository.update(updated)
    return updated
  }
}
