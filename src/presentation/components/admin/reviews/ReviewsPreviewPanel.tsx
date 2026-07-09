'use client'

import { useMemo } from 'react'
import { ReviewsAggregateHeader } from '@/presentation/sections/ReviewsAggregateHeader'
import { ReviewsCarouselClient } from '@/presentation/sections/ReviewsCarouselClient'
import { SAMPLE_REVIEWS_PREVIEW } from '@/presentation/data/sampleReviewsPreview'
import type { PublicReviewDTO } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'
import type { ReviewWebsiteVisibilityFlags } from '@/core/entities/ReviewSettings'

interface ReviewsPreviewPanelProps {
  minStarsPublic: number
  defaultDisplayMode: 'carousel' | 'grid'
  websiteVisibilityFlags: ReviewWebsiteVisibilityFlags
}

/**
 * Live mirror of the public ReviewsSection, driven by the settings form's
 * in-progress (unsaved) values rather than what's persisted — lets an admin
 * see the effect of a toggle before hitting "Save settings". Sample data
 * only; never touches the database.
 */
export function ReviewsPreviewPanel({ minStarsPublic, defaultDisplayMode, websiteVisibilityFlags }: ReviewsPreviewPanelProps) {
  const { reviews, averageRating, count } = useMemo(() => {
    const filtered = SAMPLE_REVIEWS_PREVIEW.filter((r) => r.rating >= minStarsPublic)

    const mapped: PublicReviewDTO[] = filtered.map((r) => {
      const dto: PublicReviewDTO = { id: r.id, rating: r.rating, comment: r.comment }
      if (websiteVisibilityFlags.showReviewerName) dto.reviewerName = r.reviewerName
      if (websiteVisibilityFlags.showReviewerAvatar) dto.reviewerAvatarUrl = r.reviewerAvatarUrl
      if (websiteVisibilityFlags.showDate) dto.reviewCreatedAt = r.reviewCreatedAt
      if (websiteVisibilityFlags.showTags) dto.tags = r.tags
      return dto
    })

    const average = filtered.length ? filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length : 0

    return { reviews: mapped, averageRating: average, count: filtered.length }
  }, [minStarsPublic, websiteVisibilityFlags])

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-fluid-lg font-semibold" style={{ color: 'var(--neutral-800)' }}>
          Live preview
        </h2>
        <span
          className="text-fluid-xs uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A' }}
        >
          Sample data — not saved
        </span>
      </div>
      <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
        Reacts live to the fields above (min stars, display mode, visibility toggles) before you save. This is what the
        homepage section will look like once real reviews are synced.
      </p>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(226, 192, 99, 0.2)', backgroundColor: 'var(--neutral-50)' }}
      >
        <div className="px-4 sm:px-8 py-10">
          {reviews.length === 0 ? (
            <p className="text-center text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
              No sample reviews meet the current "minimum stars" filter — try lowering it.
            </p>
          ) : (
            <>
              <ReviewsAggregateHeader averageRating={averageRating} count={count} />
              <ReviewsCarouselClient reviews={reviews} enableCarousel={defaultDisplayMode === 'carousel'} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
