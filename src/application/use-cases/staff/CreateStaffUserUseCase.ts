import bcryptjs from 'bcryptjs'
import { AdminUser, AdminRole } from '@/core/entities/AdminUser'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'

export interface CreateStaffUserInput {
  email: string
  password: string
  name: string
  role?: AdminRole
  title?: string | null
  phone?: string | null
}

export class CreateStaffUserUseCase {
  constructor(private adminUserRepository: IAdminUserRepository) {}

  async execute(input: CreateStaffUserInput): Promise<AdminUser> {
    const existing = await this.adminUserRepository.findByEmail(input.email)
    if (existing) throw new Error('Email already in use')

    const passwordHash = await bcryptjs.hash(input.password, 10)

    const user = AdminUser.create({
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      title: input.title,
      phone: input.phone,
    })

    await this.adminUserRepository.save(user)
    return user
  }
}
