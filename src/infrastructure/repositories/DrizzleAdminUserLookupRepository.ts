import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { adminUsers } from '../db/schema'

export interface AdminUserSummary {
  id: string
  name: string
  email: string
}

/**
 * Minimal read-only lookup for resolving admin user display data (e.g. task
 * assignee). This is intentionally NOT a full IAdminUserRepository/AdminUser
 * domain entity — that belongs to a later staff-management phase. This class
 * exists only so DTO converters never need an inline raw query against
 * admin_users, and never select/expose passwordHash.
 */
export class DrizzleAdminUserLookupRepository {
  async findById(id: string): Promise<AdminUserSummary | null> {
    const rows = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1)

    if (!rows.length) return null
    return rows[0]
  }

  /**
   * Active admin users for assignee/staff pickers. Never selects
   * passwordHash. Ordered by name for stable dropdown listings.
   */
  async findAllActive(): Promise<AdminUserSummary[]> {
    return db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
      })
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true))
      .orderBy(asc(adminUsers.name))
  }
}
