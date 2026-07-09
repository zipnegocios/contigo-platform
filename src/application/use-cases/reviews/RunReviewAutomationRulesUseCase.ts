import { GoogleReview } from '@/core/entities/GoogleReview'
import { Task } from '@/core/entities/Task'
import { IReviewSettingsRepository } from '@/core/repositories/IReviewSettingsRepository'
import { ITaskRepository } from '@/core/repositories/ITaskRepository'
import { IEmailService } from '@/core/services/IEmailService'
import type { ReviewAutomationRule } from '@/core/entities/ReviewSettings'

const LOW_RATING_THRESHOLD = 2
const HIGH_RATING_THRESHOLD = 5

// v1 fixed rule set (plan Phase 7) — used whenever the admin hasn't
// configured review_settings.automationRules explicitly. The full IF/THEN
// rule builder from the original spec is roadmap, not built here.
export const DEFAULT_AUTOMATION_RULES: ReviewAutomationRule[] = [
  { id: 'default-new-review-notify', trigger: 'new_review', action: 'notify_admin_email', isEnabled: true },
  { id: 'default-low-rating-notify', trigger: 'low_rating', action: 'notify_admin_email', isEnabled: true },
  { id: 'default-low-rating-task', trigger: 'low_rating', action: 'create_lead_task', isEnabled: true },
  { id: 'default-high-rating-thanks', trigger: 'high_rating', action: 'thank_you_reminder', isEnabled: false },
]

/**
 * Evaluated once per newly synced review (plan Phase 7). Every side effect
 * is independently best-effort — one rule failing must never block another,
 * or the sync itself.
 */
export class RunReviewAutomationRulesUseCase {
  constructor(
    private settingsRepository: IReviewSettingsRepository,
    private emailService: IEmailService,
    private taskRepository: ITaskRepository,
  ) {}

  async execute(newReviews: GoogleReview[], matchedLeadIdByReviewId: Map<string, string>): Promise<void> {
    if (newReviews.length === 0) return

    const settings = await this.settingsRepository.get()
    const rules = settings?.automationRules?.length
      ? (settings.automationRules as ReviewAutomationRule[])
      : DEFAULT_AUTOMATION_RULES

    for (const review of newReviews) {
      for (const rule of rules) {
        if (!rule.isEnabled) continue

        if (rule.trigger === 'new_review' && rule.action === 'notify_admin_email') {
          await this.safely(() => this.notifyAdmin('New Google review received', review))
        }

        if (rule.trigger === 'low_rating' && review.rating <= LOW_RATING_THRESHOLD) {
          if (rule.action === 'notify_admin_email') {
            await this.safely(() => this.notifyAdmin(`Low rating alert: ${review.rating}★ review`, review))
          }
          if (rule.action === 'create_lead_task') {
            const leadId = matchedLeadIdByReviewId.get(review.id)
            if (leadId) {
              await this.safely(() =>
                this.taskRepository.save(
                  Task.create({
                    leadId,
                    title: `Follow up on ${review.rating}★ Google review`,
                    description: review.comment ?? undefined,
                    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  }),
                ),
              )
            }
          }
        }

        if (rule.trigger === 'high_rating' && review.rating >= HIGH_RATING_THRESHOLD && rule.action === 'thank_you_reminder') {
          const leadId = matchedLeadIdByReviewId.get(review.id)
          if (leadId) {
            await this.safely(() =>
              this.taskRepository.save(
                Task.create({
                  leadId,
                  title: 'Send a personal thank-you for the 5★ review',
                  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                }),
              ),
            )
          }
        }
      }
    }
  }

  private async notifyAdmin(subject: string, review: GoogleReview): Promise<void> {
    const bodyHtml = `
      <p><strong>Reviewer:</strong> ${review.reviewerName}</p>
      <p><strong>Rating:</strong> ${review.rating}★</p>
      ${review.comment ? `<p><strong>Comment:</strong> ${review.comment}</p>` : ''}
    `
    await this.emailService.sendReviewAutomationAlertToAdmin({ subject, bodyHtml })
  }

  private async safely(fn: () => Promise<void>): Promise<void> {
    try {
      await fn()
    } catch (error) {
      console.error('Review automation rule side effect failed:', error)
    }
  }
}
