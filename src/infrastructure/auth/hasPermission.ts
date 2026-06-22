import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { adminUsers } from '../db/schema'
import { DrizzlePermissionRepository } from '../repositories/DrizzlePermissionRepository'

/** Owners bypass granular permissions entirely; staff are checked against staff_user_permissions. */
async function isOwner(userId: string): Promise<boolean> {
  const rows = await db.select({ role: adminUsers.role }).from(adminUsers).where(eq(adminUsers.id, userId))

  return rows[0]?.role === 'owner'
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  if (await isOwner(userId)) return true // owner siempre pasa, fast-path sin consultar staff_user_permissions

  const repo = new DrizzlePermissionRepository()
  return repo.userHasPermission(userId, permissionKey)
}
