import { IGoogleBusinessProfileService } from '@/core/services/IGoogleBusinessProfileService'
import { IGoogleReviewRepository } from '@/core/repositories/IGoogleReviewRepository'
import { IGoogleReviewPhotoRepository } from '@/core/repositories/IGoogleReviewPhotoRepository'
import { matchPhotoToReview } from '@/core/lib/matchReviewPhotos'

export interface ReviewPhotoSyncResult {
  photoCount: number
  matchedCount: number
  removedCount: number
}

/**
 * Pulls customer photos from GBP and attaches them to reviews by heuristic
 * (see matchReviewPhotos). Runs after the review sync so the reviews it
 * matches against are current. Callers treat failures as non-fatal: photos
 * are a nice-to-have on top of the review sync.
 */
export class SyncGoogleReviewPhotosUseCase {
  constructor(
    private gbpService: IGoogleBusinessProfileService,
    private reviewRepository: IGoogleReviewRepository,
    private photoRepository: IGoogleReviewPhotoRepository,
  ) {}

  async execute(): Promise<ReviewPhotoSyncResult> {
    const [photos, reviews] = await Promise.all([
      this.gbpService.listCustomerPhotos(),
      this.reviewRepository.findAll(),
    ])
    const candidates = reviews.filter((r) => !r.deletedOnGoogleAt)

    const withMatches = photos.map((photo) => ({
      ...photo,
      autoReviewId: matchPhotoToReview(photo, candidates),
    }))

    await this.photoRepository.upsertFromGoogle(withMatches)
    const removedCount = await this.photoRepository.deleteMissing(photos.map((p) => p.googleMediaName))

    return {
      photoCount: photos.length,
      matchedCount: withMatches.filter((p) => p.autoReviewId).length,
      removedCount,
    }
  }
}
