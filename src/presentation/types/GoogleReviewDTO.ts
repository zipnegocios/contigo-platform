import { GoogleReview, ReviewSentiment } from '@/core/entities/GoogleReview'

export interface GoogleReviewDTO {
  id: string
  googleReviewId: string
  reviewerName: string
  reviewerAvatarUrl: string | null
  rating: number
  comment: string | null
  reviewCreatedAt: Date
  ownerReply: string | null
  ownerReplyAt: Date | null
  isVisible: boolean
  isFeatured: boolean
  isPinned: boolean
  archivedAt: Date | null
  internalNotes: string | null
  aiSentiment: ReviewSentiment | null
  deletedOnGoogleAt: Date | null
  tagIds: string[]
}

export function toGoogleReviewDTO(review: GoogleReview, tagIds: string[] = []): GoogleReviewDTO {
  return {
    id: review.id,
    googleReviewId: review.googleReviewId,
    reviewerName: review.reviewerName,
    reviewerAvatarUrl: review.reviewerAvatarUrl,
    rating: review.rating,
    comment: review.comment,
    reviewCreatedAt: review.reviewCreatedAt,
    ownerReply: review.ownerReply,
    ownerReplyAt: review.ownerReplyAt,
    isVisible: review.isVisible,
    isFeatured: review.isFeatured,
    isPinned: review.isPinned,
    archivedAt: review.archivedAt,
    internalNotes: review.internalNotes,
    aiSentiment: review.aiSentiment,
    deletedOnGoogleAt: review.deletedOnGoogleAt,
    tagIds,
  }
}
