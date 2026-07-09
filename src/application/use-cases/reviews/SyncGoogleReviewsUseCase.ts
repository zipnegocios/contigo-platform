import { GoogleReview } from '@/core/entities/GoogleReview'
import { IGoogleBusinessProfileService } from '@/core/services/IGoogleBusinessProfileService'
import { IGoogleReviewRepository } from '@/core/repositories/IGoogleReviewRepository'
import { IReviewRequestRepository } from '@/core/repositories/IReviewRequestRepository'
import {
  IReviewSyncLogRepository,
  ReviewSyncLogResult,
  ReviewSyncTrigger,
} from '@/core/repositories/IReviewSyncLogRepository'
import { RunReviewAutomationRulesUseCase } from '@/application/use-cases/reviews/RunReviewAutomationRulesUseCase'

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Heuristic only — reviewer display name vs. the request's contact name. Never authoritative (plan §3.5). */
function isFuzzyNameMatch(reviewerName: string, contactName: string): boolean {
  const a = normalizeName(reviewerName)
  const b = normalizeName(contactName)
  if (!a || !b) return false
  if (a === b || a.includes(b) || b.includes(a)) return true
  const aFirst = a.split(' ')[0]
  const bFirst = b.split(' ')[0]
  return aFirst.length > 2 && aFirst === bFirst
}

/**
 * Full-pull reconciliation against Google Business Profile v4 reviews.
 * Moderation fields (isVisible/isFeatured/isPinned/archivedAt/internalNotes/
 * AI fields) are owned by admins and are never touched here — only content
 * fields are synced (see GoogleReview.withSyncedContent). Local rows absent
 * from the fetched set are soft-flagged via deletedOnGoogleAt, never
 * hard-deleted (plan Phase 2).
 */
export class SyncGoogleReviewsUseCase {
  constructor(
    private gbpService: IGoogleBusinessProfileService,
    private reviewRepository: IGoogleReviewRepository,
    private syncLogRepository: IReviewSyncLogRepository,
    // Optional: enables reviewed-inference matching (plan Phase 5) when wired up.
    private reviewRequestRepository?: IReviewRequestRepository,
    // Optional: enables automation rules (plan Phase 7) when wired up.
    private automationRulesUseCase?: RunReviewAutomationRulesUseCase,
  ) {}

  async execute(trigger: ReviewSyncTrigger): Promise<ReviewSyncLogResult> {
    const logId = await this.syncLogRepository.start(trigger)

    try {
      const apiItems = await this.gbpService.listReviews()
      const existing = await this.reviewRepository.findAll()
      const existingByGoogleId = new Map(existing.map((review) => [review.googleReviewId, review]))

      let newCount = 0
      let updatedCount = 0
      const seenGoogleIds = new Set<string>()
      const newlyCreated: GoogleReview[] = []

      for (const item of apiItems) {
        seenGoogleIds.add(item.googleReviewId)
        const current = existingByGoogleId.get(item.googleReviewId)

        if (!current) {
          const review = GoogleReview.create({
            googleReviewId: item.googleReviewId,
            locationId: process.env.GOOGLE_LOCATION_ID ?? '',
            reviewerName: item.reviewerName,
            reviewerAvatarUrl: item.reviewerAvatarUrl,
            reviewerProfileUrl: item.reviewerProfileUrl,
            rating: item.rating,
            comment: item.comment,
            reviewCreatedAt: item.reviewCreatedAt,
            reviewUpdatedAt: item.reviewUpdatedAt,
            language: item.language,
          })
          await this.reviewRepository.save(review)
          newCount++
          newlyCreated.push(review)
          continue
        }

        const hasChanged =
          current.reviewUpdatedAt.getTime() !== item.reviewUpdatedAt.getTime() ||
          current.comment !== item.comment ||
          current.rating !== item.rating ||
          current.ownerReply !== item.ownerReply ||
          current.reviewerName !== item.reviewerName ||
          Boolean(current.deletedOnGoogleAt)

        if (hasChanged) {
          const updated = current.withSyncedContent({
            reviewerName: item.reviewerName,
            reviewerAvatarUrl: item.reviewerAvatarUrl,
            reviewerProfileUrl: item.reviewerProfileUrl,
            rating: item.rating,
            comment: item.comment,
            reviewUpdatedAt: item.reviewUpdatedAt,
            language: item.language,
            ownerReply: item.ownerReply,
            ownerReplyAt: item.ownerReplyAt,
          })
          await this.reviewRepository.update(updated)
          updatedCount++
        }
      }

      let deletedCount = 0
      for (const local of existing) {
        if (!seenGoogleIds.has(local.googleReviewId) && !local.deletedOnGoogleAt) {
          await this.reviewRepository.update(local.markDeletedOnGoogle())
          deletedCount++
        }
      }

      if (newlyCreated.length) {
        const matchedLeadIdByReviewId = await this.matchNewReviewsToRequests(newlyCreated)
        if (this.automationRulesUseCase) {
          await this.automationRulesUseCase.execute(newlyCreated, matchedLeadIdByReviewId)
        }
      }

      const result: ReviewSyncLogResult = { status: 'success', newCount, updatedCount, deletedCount }
      await this.syncLogRepository.finish(logId, result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      await this.syncLogRepository.finish(logId, {
        status: 'failed',
        newCount: 0,
        updatedCount: 0,
        deletedCount: 0,
        errorMessage,
      })
      throw error
    }
  }

  /**
   * Best-effort reviewed-inference (plan §3.5): matches a newly synced review
   * to a pending review_requests row by reviewer name vs. contact name, when
   * the review postdates the request's send. Never authoritative — the admin
   * UI must label this as inferred, not confirmed.
   */
  private async matchNewReviewsToRequests(newReviews: GoogleReview[]): Promise<Map<string, string>> {
    const matchedLeadIdByReviewId = new Map<string, string>()
    if (!this.reviewRequestRepository) return matchedLeadIdByReviewId

    const candidates = await this.reviewRequestRepository.findAwaitingMatch()
    if (!candidates.length) return matchedLeadIdByReviewId

    for (const review of newReviews) {
      const match = candidates.find(
        (request) =>
          !request.matchedReviewId &&
          request.sentAt &&
          review.reviewCreatedAt.getTime() > request.sentAt.getTime() &&
          isFuzzyNameMatch(review.reviewerName, request.contactName),
      )
      if (match) {
        await this.reviewRequestRepository.update(match.markReviewedInferred(review.id))
        matchedLeadIdByReviewId.set(review.id, match.leadId)
      }
    }
    return matchedLeadIdByReviewId
  }
}
