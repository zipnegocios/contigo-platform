import { eq, and } from 'drizzle-orm'
import { db } from '../db/client'
import { reviewTags, googleReviewTags } from '../db/schema'
import type { IReviewTagRepository, ReviewTag } from '@/core/repositories/IReviewTagRepository'

function mapRow(row: typeof reviewTags.$inferSelect): ReviewTag {
  return { id: row.id, name: row.name, color: row.color, createdAt: row.createdAt }
}

export class DrizzleReviewTagRepository implements IReviewTagRepository {
  async findAll(): Promise<ReviewTag[]> {
    const rows = await db.select().from(reviewTags).orderBy(reviewTags.name)
    return rows.map(mapRow)
  }

  async create(input: { name: string; color?: string }): Promise<ReviewTag> {
    const rows = await db
      .insert(reviewTags)
      .values({ name: input.name, color: input.color ?? '#E2C063' })
      .returning()
    return mapRow(rows[0])
  }

  async delete(id: string): Promise<void> {
    await db.delete(reviewTags).where(eq(reviewTags.id, id))
  }

  async findTagIdsForReview(reviewId: string): Promise<string[]> {
    const rows = await db
      .select({ tagId: googleReviewTags.tagId })
      .from(googleReviewTags)
      .where(eq(googleReviewTags.reviewId, reviewId))
    return rows.map((r) => r.tagId)
  }

  async assignToReview(reviewId: string, tagId: string): Promise<void> {
    await db.insert(googleReviewTags).values({ reviewId, tagId }).onConflictDoNothing()
  }

  async removeFromReview(reviewId: string, tagId: string): Promise<void> {
    await db
      .delete(googleReviewTags)
      .where(and(eq(googleReviewTags.reviewId, reviewId), eq(googleReviewTags.tagId, tagId)))
  }
}
