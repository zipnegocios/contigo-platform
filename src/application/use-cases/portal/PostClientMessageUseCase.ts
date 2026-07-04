import { Lead } from '@/core/entities/Lead'
import { Quote } from '@/core/entities/Quote'
import { LeadMessage } from '@/core/entities/LeadMessage'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadMessageRepository } from '@/core/repositories/ILeadMessageRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { IEmailService } from '@/core/services/IEmailService'

export interface PostClientMessageInput {
  lead: Lead
  quote: Quote
  body: string
}

/**
 * Persists a client-authored message on the public tracking panel (`/quote-status/[token]`).
 *
 * Token resolution (quote + lead lookup) is the caller's responsibility — the route
 * handler already resolves `quote` via `IQuoteRepository.findByToken` and `lead` via
 * `ILeadRepository.findByQuoteId` (same pattern as `GetTrackingPanelDataUseCase` and the
 * quote-status attachment routes). This use case stays focused on "persist message + log
 * activity + notify admin", not capability-token resolution.
 */
export class PostClientMessageUseCase {
  constructor(
    private leadMessageRepository: ILeadMessageRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private emailService: IEmailService,
  ) {}

  async execute(input: PostClientMessageInput): Promise<LeadMessage> {
    const trimmedBody = input.body.trim()

    if (trimmedBody.length === 0) {
      throw new Error('Message body cannot be empty')
    }

    if (trimmedBody.length > 2000) {
      throw new Error('Message body cannot exceed 2000 characters')
    }

    const message = LeadMessage.create({
      leadId: input.lead.id,
      authorType: 'client',
      body: trimmedBody,
    })
    await this.leadMessageRepository.save(message)

    const activity = LeadActivity.create({
      leadId: input.lead.id,
      type: 'message_received',
      payload: { messageId: message.id },
    })
    await this.leadActivityRepository.save(activity)

    try {
      await this.emailService.sendNewMessageNotificationToAdmin(input.lead, input.quote)
    } catch (error) {
      // The message is already persisted — a failed notification email must not
      // fail the request. Log server-side and move on.
      console.error(`Failed to send new-message admin notification for lead ${input.lead.id}:`, error)
    }

    return message
  }
}
