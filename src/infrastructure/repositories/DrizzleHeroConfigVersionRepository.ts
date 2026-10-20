import { desc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db/client'
import { heroConfigVersions } from '@/infrastructure/db/schema'
import type { IHeroConfigVersionRepository } from '@/core/repositories/IHeroConfigVersionRepository'
import { MAX_RECENT_HERO_VERSIONS, type HeroConfigVersion } from '@/core/entities/HeroConfigVersion'
import type { HeroConfigInput } from '@/core/entities/HeroConfig'

function mapRow(row: typeof heroConfigVersions.$inferSelect): HeroConfigVersion {
  return {
    id: row.id,
    label: row.label,
    tag: row.tag ?? undefined,
    snapshot: row.snapshot as HeroConfigInput,
    archivedAt: row.archivedAt ?? undefined,
    createdAt: row.createdAt,
  }
}

export class DrizzleHeroConfigVersionRepository implements IHeroConfigVersionRepository {
  async list(): Promise<HeroConfigVersion[]> {
    const rows = await db.select().from(heroConfigVersions).orderBy(desc(heroConfigVersions.createdAt))
    return rows.map(mapRow)
  }

  async findById(id: string): Promise<HeroConfigVersion | null> {
    const rows = await db.select().from(heroConfigVersions).where(eq(heroConfigVersions.id, id)).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }

  async create(
    label: string,
    snapshot: HeroConfigInput,
    opts: { tag?: string; protectId?: string } = {},
  ): Promise<HeroConfigVersion> {
    const rows = await db.insert(heroConfigVersions).values({ label, snapshot, tag: opts.tag || null }).returning()
    await this.pruneRecent(opts.protectId)
    return mapRow(rows[0])
  }

  async update(id: string, patch: { archived?: boolean; tag?: string | null }): Promise<HeroConfigVersion | null> {
    const set: Partial<typeof heroConfigVersions.$inferInsert> = {}
    if (patch.archived !== undefined) set.archivedAt = patch.archived ? new Date() : null
    if (patch.tag !== undefined) set.tag = patch.tag || null
    const rows = await db.update(heroConfigVersions).set(set).where(eq(heroConfigVersions.id, id)).returning()
    if (!rows[0]) return null
    // Un-archiving puts it back among the recent ones, which are capped.
    if (patch.archived === false) await this.pruneRecent(id)
    return mapRow(rows[0])
  }

  async delete(id: string): Promise<void> {
    await db.delete(heroConfigVersions).where(eq(heroConfigVersions.id, id))
  }

  private async pruneRecent(protectId?: string): Promise<void> {
    const recent = await db
      .select({ id: heroConfigVersions.id })
      .from(heroConfigVersions)
      .where(isNull(heroConfigVersions.archivedAt))
      .orderBy(desc(heroConfigVersions.createdAt))
    const overflow = recent.slice(MAX_RECENT_HERO_VERSIONS).map((r) => r.id).filter((id) => id !== protectId)
    if (overflow.length) {
      await db.delete(heroConfigVersions).where(inArray(heroConfigVersions.id, overflow))
    }
  }
}
