import { IGoogleReviewRepository } from '@/core/repositories/IGoogleReviewRepository'
import { IReviewSettingsRepository } from '@/core/repositories/IReviewSettingsRepository'
import { IReviewTagRepository } from '@/core/repositories/IReviewTagRepository'
import type { ReviewWebsiteVisibilityFlags } from '@/core/entities/ReviewSettings'

export interface PublicReviewDTO {
  id: string
  rating: number
  comment: string | null
  reviewerName?: string
  reviewerAvatarUrl?: string | null
  reviewCreatedAt?: string
  tags?: string[]
}

export interface PublicReviewsResult {
  reviews: PublicReviewDTO[]
  averageRating: number
  count: number
  displayMode: 'carousel' | 'grid'
}

const DEFAULT_MIN_STARS = 4
const DEFAULT_DISPLAY_MODE: 'carousel' | 'grid' = 'carousel'
const DEFAULT_VISIBILITY_FLAGS: ReviewWebsiteVisibilityFlags = {
  showReviewerName: true,
  showReviewerAvatar: true,
  showDate: true,
  showTags: false,
}

/**
 * Reads only from the local cache — the public website never queries
 * Google directly (plan core architectural decision). Per-field visibility
 * flags are applied here so disabled fields are absent from the payload
 * entirely, not just hidden client-side.
 */
export class GetPublicReviewsUseCase {
  constructor(
    private reviewRepository: IGoogleReviewRepository,
    private settingsRepository: IReviewSettingsRepository,
    private tagRepository: IReviewTagRepository,
  ) {}

  async execute(): Promise<PublicReviewsResult> {
    const settings = await this.settingsRepository.get()
    const minStars = settings?.minStarsPublic ?? DEFAULT_MIN_STARS
    const displayMode = settings?.defaultDisplayMode ?? DEFAULT_DISPLAY_MODE
    const flags = settings?.websiteVisibilityFlags ?? DEFAULT_VISIBILITY_FLAGS

    const reviews = await this.reviewRepository.findPublic(minStars)

    const averageRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // review_settings has no explicit ordering-mode column (Phase 1 schema)
    // — featured-first is the fixed default; pinned reviews always float to
    // the top on top of that (see applyOrdering below).
    const ordered = this.applyOrdering(reviews, 'featured-first')

    const allTags = flags.showTags ? await this.tagRepository.findAll() : []
    const tagNameById = new Map(allTags.map((t) => [t.id, t.name]))

    const dtos: PublicReviewDTO[] = await Promise.all(
      ordered.map(async (review) => {
        const dto: PublicReviewDTO = { id: review.id, rating: review.rating, comment: review.comment }
        if (flags.showReviewerName) dto.reviewerName = review.reviewerName
        if (flags.showReviewerAvatar) dto.reviewerAvatarUrl = review.reviewerAvatarUrl
        if (flags.showDate) dto.reviewCreatedAt = review.reviewCreatedAt.toISOString()
        if (flags.showTags) {
          const tagIds = await this.tagRepository.findTagIdsForReview(review.id)
          dto.tags = tagIds.map((id) => tagNameById.get(id)).filter((name): name is string => !!name)
        }
        return dto
      }),
    )

    return { reviews: dtos, averageRating, count: reviews.length, displayMode }
  }

  private applyOrdering<T extends { isPinned: boolean; isFeatured: boolean; rating: number; reviewCreatedAt: Date }>(
    reviews: T[],
    mode: 'recent' | 'rating' | 'featured-first' | 'random',
  ): T[] {
    const base = [...reviews]
    switch (mode) {
      case 'rating':
        base.sort((a, b) => b.rating - a.rating)
        break
      case 'random':
        for (let i = base.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[base[i], base[j]] = [base[j], base[i]]
        }
        break
      case 'featured-first':
        base.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
        break
      case 'recent':
      default:
        base.sort((a, b) => b.reviewCreatedAt.getTime() - a.reviewCreatedAt.getTime())
    }
    // Pinned always float to the top regardless of ordering mode.
    return base.sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
  }
}
