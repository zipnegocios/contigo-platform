import { AdminUser } from '@/core/entities/AdminUser'

export interface IAdminUserRepository {
  save(user: AdminUser): Promise<void>
  findById(id: string): Promise<AdminUser | null>
  findByEmail(email: string): Promise<AdminUser | null>
  /** All staff, active and inactive — for the staff management table. */
  findAll(): Promise<AdminUser[]>
  update(user: AdminUser): Promise<void>
}
