export type ReviewPhotoMatchSource = 'auto' | 'manual'

export interface GoogleReviewPhoto {
  id: string
  googleMediaName: string
  /** Inferred at sync time, or set by an admin when `matchSource` is 'manual'. */
  reviewId: string | null
  matchSource: ReviewPhotoMatchSource
  googleUrl: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  /** Google requires showing this attribution as provided. */
  attributionName: string | null
  attributionProfileUrl: string | null
  mediaCreatedAt: Date
  isHidden: boolean
  syncedAt: Date
}
