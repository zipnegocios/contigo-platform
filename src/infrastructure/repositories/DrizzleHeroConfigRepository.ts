import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { heroConfig } from '@/infrastructure/db/schema'
import type { IHeroConfigRepository } from '@/core/repositories/IHeroConfigRepository'
import type { HeroConfig, HeroButton, HeroSlide, HeroConfigInput } from '@/core/entities/HeroConfig'

function mapRow(row: typeof heroConfig.$inferSelect): HeroConfig {
  return {
    id: row.id,
    mode: row.mode as 'single' | 'slider',
    headline: row.headline,
    subtitle: row.subtitle ?? undefined,
    eyebrow: row.eyebrow ?? undefined,
    desktopImageUrl: row.desktopImageUrl ?? undefined,
    mobileImageUrl: row.mobileImageUrl ?? undefined,
    buttons: (row.buttons as HeroButton[]) ?? [],
    slides: (row.slides as HeroSlide[]) ?? [],
    autoplayInterval: row.autoplayInterval,
    overlayOpacity: row.overlayOpacity,
    updatedAt: row.updatedAt,
  }
}

export class DrizzleHeroConfigRepository implements IHeroConfigRepository {
  async get(): Promise<HeroConfig | null> {
    const rows = await db.select().from(heroConfig).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }

  async upsert(input: HeroConfigInput): Promise<HeroConfig> {
    const existing = await db.select({ id: heroConfig.id }).from(heroConfig).limit(1)
    const values = {
      mode: input.mode,
      headline: input.headline,
      subtitle: input.subtitle ?? null,
      eyebrow: input.eyebrow ?? null,
      desktopImageUrl: input.desktopImageUrl ?? null,
      mobileImageUrl: input.mobileImageUrl ?? null,
      buttons: input.buttons,
      slides: input.slides,
      autoplayInterval: input.autoplayInterval,
      overlayOpacity: input.overlayOpacity,
      updatedAt: new Date(),
    }
    if (existing.length > 0) {
      const rows = await db
        .update(heroConfig)
        .set(values)
        .where(eq(heroConfig.id, existing[0].id))
        .returning()
      return mapRow(rows[0])
    }
    const rows = await db.insert(heroConfig).values(values).returning()
    return mapRow(rows[0])
  }
}
