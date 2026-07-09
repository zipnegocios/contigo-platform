import { ReviewRequest } from '@/core/entities/ReviewRequest'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadContactRepository } from '@/core/repositories/ILeadContactRepository'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { IReviewRequestRepository } from '@/core/repositories/IReviewRequestRepository'
import { IReviewRequestTemplateRepository } from '@/core/repositories/IReviewRequestTemplateRepository'
import { IReviewSettingsRepository } from '@/core/repositories/IReviewSettingsRepository'
import { IReviewRequestSuppressionRepository } from '@/core/repositories/IReviewRequestSuppressionRepository'

const DEFAULT_REQUEST_DELAY_DAYS = 3
const PENDING_STATUSES = new Set(['scheduled', 'sent', 'opened', 'clicked'])

/**
 * Schedules a review-request email for a lead — triggered on the 'won'
 * pipeline stage (best-effort, see ChangeLeadStageUseCase) or manually from
 * the lead detail page (plan Phase 5). Resolves the contact to email: the
 * primary lead_contact if one has an email, otherwise the original quote
 * submitter. Skips silently (returns null) if there's no email to use, a
 * pending request already exists for this lead, or the email is suppressed.
 */
export class ScheduleReviewRequestUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadContactRepository: ILeadContactRepository,
    private quoteRepository: IQuoteRepository,
    private reviewRequestRepository: IReviewRequestRepository,
    private templateRepository: IReviewRequestTemplateRepository,
    private settingsRepository: IReviewSettingsRepository,
    private suppressionRepository: IReviewRequestSuppressionRepository,
  ) {}

  async execute(leadId: string): Promise<ReviewRequest | null> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    const existing = await this.reviewRequestRepository.findByLeadId(leadId)
    if (existing.some((r) => PENDING_STATUSES.has(r.status))) return null

    const contact = await this.resolveContact(lead.quoteId, leadId)
    if (!contact) return null

    if (await this.suppressionRepository.isSuppressed(contact.email)) return null

    const template = await this.templateRepository.findDefault()
    if (!template) throw new Error('No default review request template configured')

    const settings = await this.settingsRepository.get()
    const delayDays = settings?.requestDelayDays ?? DEFAULT_REQUEST_DELAY_DAYS

    const scheduledFor = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000)

    const request = ReviewRequest.create({
      leadId,
      contactEmail: contact.email,
      contactName: contact.name,
      templateId: template.id,
      scheduledFor,
    })
    await this.reviewRequestRepository.save(request)
    return request
  }

  private async resolveContact(quoteId: string, leadId: string): Promise<{ name: string; email: string } | null> {
    const contacts = await this.leadContactRepository.findByLeadId(leadId)
    const primary = contacts.find((c) => c.isPrimary && c.email && !c.archivedAt) ?? contacts.find((c) => c.email && !c.archivedAt)
    if (primary?.email) return { name: primary.name, email: primary.email }

    const quote = await this.quoteRepository.findById(quoteId)
    if (quote) return { name: quote.name, email: quote.email.toString() }

    return null
  }
}
