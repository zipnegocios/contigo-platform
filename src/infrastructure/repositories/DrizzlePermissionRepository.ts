import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { staffUserPermissions } from '../db/schema'
import { IPermissionRepository } from '@/core/repositories/IPermissionRepository'

export class DrizzlePermissionRepository implements IPermissionRepository {
  async findAllForUser(userId: string): Promise<string[]> {
    const rows = await db
      .select({ permissionKey: staffUserPermissions.permissionKey })
      .from(staffUserPermissions)
      .where(eq(staffUserPermissions.userId, userId))

    return rows.map((row) => row.permissionKey)
  }

  async setForUser(userId: string, permissionKeys: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(staffUserPermissions).where(eq(staffUserPermissions.userId, userId))

      if (permissionKeys.length === 0) return

      await tx.insert(staffUserPermissions).values(
        permissionKeys.map((permissionKey) => ({
          userId,
          permissionKey,
        })),
      )
    })
  }

  async userHasPermission(userId: string, key: string): Promise<boolean> {
    const rows = await db
      .select({ permissionKey: staffUserPermissions.permissionKey })
      .from(staffUserPermissions)
      .where(and(eq(staffUserPermissions.userId, userId), eq(staffUserPermissions.permissionKey, key)))
      .limit(1)

    return rows.length > 0
  }
}
