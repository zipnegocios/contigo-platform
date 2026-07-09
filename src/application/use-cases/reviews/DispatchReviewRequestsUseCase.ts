import { ReviewRequest } from '@/core/entities/ReviewRequest'
import { IReviewRequestRepository } from '@/core/repositories/IReviewRequestRepository'
import { IReviewRequestTemplateRepository } from '@/core/repositories/IReviewRequestTemplateRepository'
import { IReviewSettingsRepository } from '@/core/repositories/IReviewSettingsRepository'
import { IReviewRequestSuppressionRepository } from '@/core/repositories/IReviewRequestSuppressionRepository'
import { IEmailService } from '@/core/services/IEmailService'
import { generateUnsubscribeToken } from '@/infrastructure/services/reviewUnsubscribeToken'

const DEFAULT_MAX_REMINDERS = 2
const DEFAULT_REMINDER_INTERVAL_DAYS = 7

export interface DispatchReviewRequestsResult {
  sent: number
  reminded: number
  expired: number
  cancelled: number
}

/**
 * Sends due `scheduled` requests and due reminders (plan Phase 5). Intended
 * to run from the internal cron endpoint alongside the review sync — each
 * request's own `scheduledFor` / `nextReminderAt` is what makes the cron
 * schedule itself trivial (just run this often; the use case no-ops per
 * request until its own due time).
 */
export class DispatchReviewRequestsUseCase {
  constructor(
    private reviewRequestRepository: IReviewRequestRepository,
    private templateRepository: IReviewRequestTemplateRepository,
    private settingsRepository: IReviewSettingsRepository,
    private suppressionRepository: IReviewRequestSuppressionRepository,
    private emailService: IEmailService,
  ) {}

  async execute(): Promise<DispatchReviewRequestsResult> {
    const settings = await this.settingsRepository.get()
    const maxReminders = settings?.maxRemindersPerRequest ?? DEFAULT_MAX_REMINDERS
    const reminderIntervalDays = settings?.reminderIntervalDays ?? DEFAULT_REMINDER_INTERVAL_DAYS

    const now = new Date()
    const result: DispatchReviewRequestsResult = { sent: 0, reminded: 0, expired: 0, cancelled: 0 }

    const due = await this.reviewRequestRepository.findDueToSend(now)
    for (const request of due) {
      const outcome = await this.sendOrCancel(request, reminderIntervalDays)
      if (outcome === 'sent') result.sent++
      else if (outcome === 'cancelled') result.cancelled++
    }

    const reminders = await this.reviewRequestRepository.findDueForReminder(now)
    for (const request of reminders) {
      if (request.hasReachedReminderLimit(maxReminders)) {
        await this.reviewRequestRepository.update(request.markExpired())
        result.expired++
        continue
      }
      const outcome = await this.sendOrCancel(request, reminderIntervalDays)
      if (outcome === 'sent') result.reminded++
      else if (outcome === 'cancelled') result.cancelled++
    }

    return result
  }

  private async sendOrCancel(request: ReviewRequest, reminderIntervalDays: number): Promise<'sent' | 'cancelled'> {
    if (await this.suppressionRepository.isSuppressed(request.contactEmail)) {
      await this.reviewRequestRepository.update(request.cancel())
      return 'cancelled'
    }

    const template = await this.templateRepository.findById(request.templateId)
    if (!template) {
      console.error(`Review request ${request.id} references a missing template ${request.templateId}`)
      await this.reviewRequestRepository.update(request.cancel())
      return 'cancelled'
    }

    const { subject, bodyHtml } = this.renderTemplate(template.subject, template.bodyHtml, request)

    try {
      await this.emailService.sendReviewRequestEmail({ to: request.contactEmail, subject, bodyHtml })
    } catch (error) {
      console.error(`Failed to send review request email for ${request.id}:`, error)
      throw error
    }

    await this.reviewRequestRepository.update(request.markSent(reminderIntervalDays))
    return 'sent'
  }

  private renderTemplate(
    subjectTemplate: string,
    bodyTemplate: string,
    request: ReviewRequest,
  ): { subject: string; bodyHtml: string } {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://contigoconstructions.com.au'
    const reviewLink = `${siteUrl}/r/review-request/${request.id}`
    const unsubscribeToken = generateUnsubscribeToken(request.contactEmail)
    const unsubscribeUrl = `${siteUrl}/api/public/reviews/unsubscribe?email=${encodeURIComponent(request.contactEmail)}&token=${unsubscribeToken}`

    const substitute = (text: string) =>
      text.replaceAll('{{contactName}}', request.contactName).replaceAll('{{reviewLink}}', reviewLink)

    const subject = substitute(subjectTemplate)
    const bodyHtml = `
      ${substitute(bodyTemplate)}
      <p style="font-size:12px;color:#888;margin-top:24px;">
        Don't want to receive review request emails? <a href="${unsubscribeUrl}">Unsubscribe</a>.
      </p>
    `
    return { subject, bodyHtml }
  }
}
