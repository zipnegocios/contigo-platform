import { and, asc, eq, inArray, notInArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { googleReviewPhotos } from '../db/schema'
import type { GoogleReviewPhoto, ReviewPhotoMatchSource } from '@/core/entities/GoogleReviewPhoto'
import type { IGoogleReviewPhotoRepository } from '@/core/repositories/IGoogleReviewPhotoRepository'
import type { GoogleCustomerMediaItem } from '@/core/services/IGoogleBusinessProfileService'

function mapRow(row: typeof googleReviewPhotos.$inferSelect): GoogleReviewPhoto {
  return {
    id: row.id,
    googleMediaName: row.googleMediaName,
    reviewId: row.reviewId,
    matchSource: row.matchSource as ReviewPhotoMatchSource,
    googleUrl: row.googleUrl,
    thumbnailUrl: row.thumbnailUrl,
    width: row.width,
    height: row.height,
    attributionName: row.attributionName,
    attributionProfileUrl: row.attributionProfileUrl,
    mediaCreatedAt: row.mediaCreatedAt,
    isHidden: row.isHidden,
    syncedAt: row.syncedAt,
  }
}

export class DrizzleGoogleReviewPhotoRepository implements IGoogleReviewPhotoRepository {
  async findAll(): Promise<GoogleReviewPhoto[]> {
    const rows = await db.select().from(googleReviewPhotos).orderBy(asc(googleReviewPhotos.mediaCreatedAt))
    return rows.map(mapRow)
  }

  async findVisibleForReviews(reviewIds: string[]): Promise<GoogleReviewPhoto[]> {
    if (!reviewIds.length) return []
    const rows = await db
      .select()
      .from(googleReviewPhotos)
      .where(and(inArray(googleReviewPhotos.reviewId, reviewIds), eq(googleReviewPhotos.isHidden, false)))
      .orderBy(asc(googleReviewPhotos.mediaCreatedAt))
    return rows.map(mapRow)
  }

  async upsertFromGoogle(items: Array<GoogleCustomerMediaItem & { autoReviewId: string | null }>): Promise<void> {
    const now = new Date()
    for (const item of items) {
      await db
        .insert(googleReviewPhotos)
        .values({
          googleMediaName: item.googleMediaName,
          reviewId: item.autoReviewId,
          matchSource: 'auto',
          googleUrl: item.googleUrl,
          thumbnailUrl: item.thumbnailUrl,
          width: item.width,
          height: item.height,
          attributionName: item.attributionName,
          attributionProfileUrl: item.attributionProfileUrl,
          mediaCreatedAt: item.createdAt,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: googleReviewPhotos.googleMediaName,
          set: {
            // Manual assignments win over the heuristic.
            reviewId: sql`CASE WHEN ${googleReviewPhotos.matchSource} = 'manual' THEN ${googleReviewPhotos.reviewId} ELSE excluded.review_id END`,
            googleUrl: item.googleUrl,
            thumbnailUrl: item.thumbnailUrl,
            width: item.width,
            height: item.height,
            attributionName: item.attributionName,
            attributionProfileUrl: item.attributionProfileUrl,
            syncedAt: now,
          },
        })
    }
  }

  async deleteMissing(keepGoogleMediaNames: string[]): Promise<number> {
    const rows = await db
      .delete(googleReviewPhotos)
      .where(keepGoogleMediaNames.length ? notInArray(googleReviewPhotos.googleMediaName, keepGoogleMediaNames) : undefined)
      .returning({ id: googleReviewPhotos.id })
    return rows.length
  }

  async update(id: string, patch: { isHidden?: boolean; reviewId?: string | null }): Promise<GoogleReviewPhoto | null> {
    const set: Partial<typeof googleReviewPhotos.$inferInsert> = {}
    if (patch.isHidden !== undefined) set.isHidden = patch.isHidden
    if (patch.reviewId !== undefined) {
      set.reviewId = patch.reviewId
      set.matchSource = 'manual'
    }
    const rows = await db.update(googleReviewPhotos).set(set).where(eq(googleReviewPhotos.id, id)).returning()
    return rows[0] ? mapRow(rows[0]) : null
  }
}
