import { eq, and, gte, lte, isNull, isNotNull, desc, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { googleReviews, googleReviewTags } from '../db/schema'
import { GoogleReview, ReviewSentiment } from '@/core/entities/GoogleReview'
import { IGoogleReviewRepository, GoogleReviewFilters } from '@/core/repositories/IGoogleReviewRepository'

type GoogleReviewRow = typeof googleReviews.$inferSelect

function mapRow(row: GoogleReviewRow): GoogleReview {
  return GoogleReview.reconstruct({
    id: row.id,
    googleReviewId: row.googleReviewId,
    locationId: row.locationId,
    reviewerName: row.reviewerName,
    reviewerAvatarUrl: row.reviewerAvatarUrl,
    reviewerProfileUrl: row.reviewerProfileUrl,
    rating: row.rating,
    comment: row.comment,
    reviewCreatedAt: row.reviewCreatedAt,
    reviewUpdatedAt: row.reviewUpdatedAt,
    language: row.language,
    ownerReply: row.ownerReply,
    ownerReplyAt: row.ownerReplyAt,
    isVisible: row.isVisible,
    isFeatured: row.isFeatured,
    isPinned: row.isPinned,
    archivedAt: row.archivedAt,
    internalNotes: row.internalNotes,
    aiSummary: row.aiSummary,
    aiSentiment: row.aiSentiment as ReviewSentiment | null,
    aiCategories: row.aiCategories,
    spamScore: row.spamScore === null ? null : Number(row.spamScore),
    deletedOnGoogleAt: row.deletedOnGoogleAt,
    syncedAt: row.syncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class DrizzleGoogleReviewRepository implements IGoogleReviewRepository {
  async save(review: GoogleReview): Promise<void> {
    await db.insert(googleReviews).values({
      id: review.id,
      googleReviewId: review.googleReviewId,
      locationId: review.locationId,
      reviewerName: review.reviewerName,
      reviewerAvatarUrl: review.reviewerAvatarUrl,
      reviewerProfileUrl: review.reviewerProfileUrl,
      rating: review.rating,
      comment: review.comment,
      reviewCreatedAt: review.reviewCreatedAt,
      reviewUpdatedAt: review.reviewUpdatedAt,
      language: review.language,
      ownerReply: review.ownerReply,
      ownerReplyAt: review.ownerReplyAt,
      isVisible: review.isVisible,
      isFeatured: review.isFeatured,
      isPinned: review.isPinned,
      archivedAt: review.archivedAt,
      internalNotes: review.internalNotes,
      aiSummary: review.aiSummary,
      aiSentiment: review.aiSentiment,
      aiCategories: review.aiCategories,
      spamScore: review.spamScore === null ? null : String(review.spamScore),
      deletedOnGoogleAt: review.deletedOnGoogleAt,
      syncedAt: review.syncedAt,
    })
  }

  async update(review: GoogleReview): Promise<void> {
    await db
      .update(googleReviews)
      .set({
        reviewerName: review.reviewerName,
        reviewerAvatarUrl: review.reviewerAvatarUrl,
        reviewerProfileUrl: review.reviewerProfileUrl,
        rating: review.rating,
        comment: review.comment,
        reviewUpdatedAt: review.reviewUpdatedAt,
        language: review.language,
        ownerReply: review.ownerReply,
        ownerReplyAt: review.ownerReplyAt,
        isVisible: review.isVisible,
        isFeatured: review.isFeatured,
        isPinned: review.isPinned,
        archivedAt: review.archivedAt,
        internalNotes: review.internalNotes,
        aiSummary: review.aiSummary,
        aiSentiment: review.aiSentiment,
        aiCategories: review.aiCategories,
        spamScore: review.spamScore === null ? null : String(review.spamScore),
        deletedOnGoogleAt: review.deletedOnGoogleAt,
        syncedAt: review.syncedAt,
        updatedAt: review.updatedAt,
      })
      .where(eq(googleReviews.id, review.id))
  }

  async findById(id: string): Promise<GoogleReview | null> {
    const rows = await db.select().from(googleReviews).where(eq(googleReviews.id, id)).limit(1)
    if (!rows.length) return null
    return mapRow(rows[0])
  }

  async findByGoogleReviewId(googleReviewId: string): Promise<GoogleReview | null> {
    const rows = await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.googleReviewId, googleReviewId))
      .limit(1)
    if (!rows.length) return null
    return mapRow(rows[0])
  }

  async findAll(filters?: GoogleReviewFilters): Promise<GoogleReview[]> {
    const conditions = []
    if (filters?.rating !== undefined) conditions.push(eq(googleReviews.rating, filters.rating))
    if (filters?.isVisible !== undefined) conditions.push(eq(googleReviews.isVisible, filters.isVisible))
    if (filters?.sentiment !== undefined) conditions.push(eq(googleReviews.aiSentiment, filters.sentiment as ReviewSentiment))
    if (filters?.hasReply !== undefined) {
      conditions.push(filters.hasReply ? isNotNull(googleReviews.ownerReply) : isNull(googleReviews.ownerReply))
    }
    if (filters?.dateFrom) conditions.push(gte(googleReviews.reviewCreatedAt, filters.dateFrom))
    if (filters?.dateTo) conditions.push(lte(googleReviews.reviewCreatedAt, filters.dateTo))

    let reviewIdsForTag: string[] | null = null
    if (filters?.tagId) {
      const tagRows = await db
        .select({ reviewId: googleReviewTags.reviewId })
        .from(googleReviewTags)
        .where(eq(googleReviewTags.tagId, filters.tagId))
      reviewIdsForTag = tagRows.map((r) => r.reviewId)
      if (reviewIdsForTag.length === 0) return []
      conditions.push(inArray(googleReviews.id, reviewIdsForTag))
    }

    const rows = await db
      .select()
      .from(googleReviews)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(googleReviews.reviewCreatedAt))

    return rows.map(mapRow)
  }

  async findPublic(minStars: number): Promise<GoogleReview[]> {
    const rows = await db
      .select()
      .from(googleReviews)
      .where(
        and(
          eq(googleReviews.isVisible, true),
          isNull(googleReviews.archivedAt),
          isNull(googleReviews.deletedOnGoogleAt),
          gte(googleReviews.rating, minStars),
        ),
      )
      .orderBy(desc(googleReviews.reviewCreatedAt))
    return rows.map(mapRow)
  }

  async findUnmatchedSince(since: Date): Promise<GoogleReview[]> {
    const rows = await db
      .select()
      .from(googleReviews)
      .where(gte(googleReviews.reviewCreatedAt, since))
      .orderBy(desc(googleReviews.reviewCreatedAt))
    return rows.map(mapRow)
  }
}
