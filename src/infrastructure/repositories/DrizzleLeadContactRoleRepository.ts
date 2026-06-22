import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadContactRoles } from '../db/schema'
import { LeadContactRole } from '@/core/entities/LeadContactRole'
import { ILeadContactRoleRepository } from '@/core/repositories/ILeadContactRoleRepository'

export class DrizzleLeadContactRoleRepository implements ILeadContactRoleRepository {
  async findAll(): Promise<LeadContactRole[]> {
    const rows = await db
      .select()
      .from(leadContactRoles)
      .orderBy(asc(leadContactRoles.label))
    return rows.map((row) => this.mapRow(row))
  }

  async findByKey(key: string): Promise<LeadContactRole | null> {
    const rows = await db
      .select()
      .from(leadContactRoles)
      .where(eq(leadContactRoles.key, key))
      .limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findById(id: string): Promise<LeadContactRole | null> {
    const rows = await db
      .select()
      .from(leadContactRoles)
      .where(eq(leadContactRoles.id, id))
      .limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async create(input: { key: string; label: string }): Promise<LeadContactRole> {
    const role = LeadContactRole.create(input)
    await db.insert(leadContactRoles).values({
      id: role.id,
      key: role.key,
      label: role.label,
      isDefault: role.isDefault,
    })
    return role
  }

  private mapRow(row: typeof leadContactRoles.$inferSelect): LeadContactRole {
    return LeadContactRole.reconstruct({
      id: row.id,
      key: row.key,
      label: row.label,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
    })
  }
}
