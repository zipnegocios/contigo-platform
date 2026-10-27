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

export interface GoogleCustomerMediaItem {
  googleMediaName: string // v4 resource name: accounts/{a}/locations/{l}/media/customers/{id}
  googleUrl: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  createdAt: Date
  attributionName: string | null
  attributionProfileUrl: string | null
}

export interface IGoogleBusinessProfileService {
  /** Cheapest possible live call — for connection health checks, fetches nothing beyond token + account resolution. */
  checkConnection(): Promise<void>
  /** Full-pull of every review for the configured location (handles v4 pagination internally). */
  listReviews(): Promise<GoogleReviewApiItem[]>
  /** Customer-contributed photos for the location (videos skipped). Not linked to reviews by Google. */
  listCustomerPhotos(): Promise<GoogleCustomerMediaItem[]>
  updateReply(googleReviewId: string, comment: string): Promise<void>
  deleteReply(googleReviewId: string): Promise<void>
}
