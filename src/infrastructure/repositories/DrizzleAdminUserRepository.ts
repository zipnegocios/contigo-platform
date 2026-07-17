import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { adminUsers } from '../db/schema'
import { AdminUser, AdminRole } from '@/core/entities/AdminUser'
import { IAdminUserRepository } from '@/core/repositories/IAdminUserRepository'

export class DrizzleAdminUserRepository implements IAdminUserRepository {
  async save(user: AdminUser): Promise<void> {
    await db.insert(adminUsers).values({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role,
      title: user.title,
      phone: user.phone,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      sessionVersion: user.sessionVersion,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  }

  async findById(id: string): Promise<AdminUser | null> {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  /** All staff, active and inactive — for the staff management table. */
  async findAll(): Promise<AdminUser[]> {
    const rows = await db.select().from(adminUsers).orderBy(asc(adminUsers.name))
    return rows.map((row) => this.mapRow(row))
  }

  async update(user: AdminUser): Promise<void> {
    await db
      .update(adminUsers)
      .set({
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        title: user.title,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        sessionVersion: user.sessionVersion,
        failedLoginCount: user.failedLoginCount,
        lockedUntil: user.lockedUntil,
        updatedAt: user.updatedAt,
      })
      .where(eq(adminUsers.id, user.id))
  }

  private mapRow(row: typeof adminUsers.$inferSelect): AdminUser {
    return AdminUser.reconstruct({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      role: row.role as AdminRole,
      title: row.title,
      phone: row.phone,
      isActive: row.isActive,
      lastLogin: row.lastLogin,
      sessionVersion: row.sessionVersion,
      failedLoginCount: row.failedLoginCount,
      lockedUntil: row.lockedUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
