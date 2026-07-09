import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { reviewSyncLogs } from '../db/schema'
import type {
  IReviewSyncLogRepository,
  ReviewSyncLog,
  ReviewSyncLogResult,
  ReviewSyncTrigger,
  ReviewSyncStatus,
} from '@/core/repositories/IReviewSyncLogRepository'

function mapRow(row: typeof reviewSyncLogs.$inferSelect): ReviewSyncLog {
  return {
    id: row.id,
    trigger: row.trigger,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    status: row.status as ReviewSyncStatus | null,
    newCount: row.newCount,
    updatedCount: row.updatedCount,
    deletedCount: row.deletedCount,
    errorMessage: row.errorMessage,
  }
}

export class DrizzleReviewSyncLogRepository implements IReviewSyncLogRepository {
  async start(trigger: ReviewSyncTrigger): Promise<string> {
    const rows = await db.insert(reviewSyncLogs).values({ trigger }).returning({ id: reviewSyncLogs.id })
    return rows[0].id
  }

  async finish(id: string, result: ReviewSyncLogResult): Promise<void> {
    await db
      .update(reviewSyncLogs)
      .set({
        finishedAt: new Date(),
        status: result.status,
        newCount: result.newCount,
        updatedCount: result.updatedCount,
        deletedCount: result.deletedCount,
        errorMessage: result.errorMessage ?? null,
      })
      .where(eq(reviewSyncLogs.id, id))
  }

  async findLatestSuccessful(): Promise<ReviewSyncLog | null> {
    const rows = await db
      .select()
      .from(reviewSyncLogs)
      .where(eq(reviewSyncLogs.status, 'success'))
      .orderBy(desc(reviewSyncLogs.finishedAt))
      .limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }

  async findLatest(): Promise<ReviewSyncLog | null> {
    const rows = await db.select().from(reviewSyncLogs).orderBy(desc(reviewSyncLogs.startedAt)).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }
}
