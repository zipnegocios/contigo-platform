export interface GoogleReviewApiItem {
  googleReviewId: string // v4 resource name: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  reviewerName: string
  reviewerAvatarUrl: string | null
  reviewerProfileUrl: string | null // v4 does not expose this; kept null, reserved for a future API version
  rating: number
  comment: string | null
  reviewCreatedAt: Date
  reviewUpdatedAt: Date
  language: string | null
  ownerReply: string | null
  ownerReplyAt: Date | null
}

export interface IGoogleBusinessProfileService {
  /** Full-pull of every review for the configured location (handles v4 pagination internally). */
  listReviews(): Promise<GoogleReviewApiItem[]>
  updateReply(googleReviewId: string, comment: string): Promise<void>
  deleteReply(googleReviewId: string): Promise<void>
}
