import { GoogleReview } from '@/core/entities/GoogleReview'

export interface GoogleReviewFilters {
  rating?: number
  isVisible?: boolean
  sentiment?: string
  tagId?: string
  hasReply?: boolean
  dateFrom?: Date
  dateTo?: Date
}

export interface IGoogleReviewRepository {
  save(review: GoogleReview): Promise<void>
  update(review: GoogleReview): Promise<void>
  findById(id: string): Promise<GoogleReview | null>
  findByGoogleReviewId(googleReviewId: string): Promise<GoogleReview | null>
  findAll(filters?: GoogleReviewFilters): Promise<GoogleReview[]>
  findPublic(minStars: number): Promise<GoogleReview[]> // isVisible=true, archivedAt/deletedOnGoogleAt null, rating >= minStars
  findUnmatchedSince(since: Date): Promise<GoogleReview[]> // candidates for review-request fuzzy matching
}
