import type { GoogleReviewPhoto } from '../entities/GoogleReviewPhoto'
import type { GoogleCustomerMediaItem } from '../services/IGoogleBusinessProfileService'

export interface IGoogleReviewPhotoRepository {
  findAll(): Promise<GoogleReviewPhoto[]>
  /** Visible photos attached to the given reviews. */
  findVisibleForReviews(reviewIds: string[]): Promise<GoogleReviewPhoto[]>
  /**
   * Inserts/refreshes photos from Google. `autoReviewId` is applied only to
   * photos not assigned manually; `isHidden` is never touched.
   */
  upsertFromGoogle(items: Array<GoogleCustomerMediaItem & { autoReviewId: string | null }>): Promise<void>
  /** Removes photos no longer returned by Google. */
  deleteMissing(keepGoogleMediaNames: string[]): Promise<number>
  update(id: string, patch: { isHidden?: boolean; reviewId?: string | null }): Promise<GoogleReviewPhoto | null>
}
