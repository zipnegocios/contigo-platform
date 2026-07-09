import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { reviewSettings } from '@/infrastructure/db/schema'
import type { IReviewSettingsRepository } from '@/core/repositories/IReviewSettingsRepository'
import type {
  ReviewSettings,
  ReviewSettingsInput,
  ReviewWebsiteVisibilityFlags,
  ReviewAutomationRule,
} from '@/core/entities/ReviewSettings'

function mapRow(row: typeof reviewSettings.$inferSelect): ReviewSettings {
  return {
    id: row.id,
    syncFrequencyMinutes: row.syncFrequencyMinutes,
    requestDelayDays: row.requestDelayDays,
    maxRemindersPerRequest: row.maxRemindersPerRequest,
    reminderIntervalDays: row.reminderIntervalDays,
    minStarsPublic: row.minStarsPublic,
    defaultDisplayMode: row.defaultDisplayMode as 'carousel' | 'grid',
    websiteVisibilityFlags: row.websiteVisibilityFlags as unknown as ReviewWebsiteVisibilityFlags,
    automationRules: row.automationRules as unknown as ReviewAutomationRule[],
    updatedAt: row.updatedAt,
  }
}

export class DrizzleReviewSettingsRepository implements IReviewSettingsRepository {
  async get(): Promise<ReviewSettings | null> {
    const rows = await db.select().from(reviewSettings).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }

  async upsert(input: ReviewSettingsInput): Promise<ReviewSettings> {
    const existing = await db.select({ id: reviewSettings.id }).from(reviewSettings).limit(1)
    const values = {
      syncFrequencyMinutes: input.syncFrequencyMinutes,
      requestDelayDays: input.requestDelayDays,
      maxRemindersPerRequest: input.maxRemindersPerRequest,
      reminderIntervalDays: input.reminderIntervalDays,
      minStarsPublic: input.minStarsPublic,
      defaultDisplayMode: input.defaultDisplayMode,
      websiteVisibilityFlags: input.websiteVisibilityFlags as unknown as Record<string, boolean>,
      automationRules: input.automationRules as unknown as Record<string, unknown>[],
      updatedAt: new Date(),
    }
    if (existing.length > 0) {
      const rows = await db.update(reviewSettings).set(values).where(eq(reviewSettings.id, existing[0].id)).returning()
      return mapRow(rows[0])
    }
    const rows = await db.insert(reviewSettings).values(values).returning()
    return mapRow(rows[0])
  }
}
