import { Lead } from '@/core/entities/Lead'
import { Quote } from '@/core/entities/Quote'
import { LeadMessage } from '@/core/entities/LeadMessage'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadMessageRepository } from '@/core/repositories/ILeadMessageRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { IEmailService } from '@/core/services/IEmailService'

export interface PostStaffMessageInput {
  lead: Lead
  quote: Quote
  body: string
  authorId?: string
}

/**
 * Persists a staff-authored message from the admin lead detail panel
 * (`app/admin/(protected)/leads/[id]`). The route handler resolves `lead` and `quote`
 * (same pattern used across the admin lead routes) and passes them in — this use case's
 * responsibility is "persist message + log activity + notify client", not lookup.
 */
export class PostStaffMessageUseCase {
  constructor(
    private leadMessageRepository: ILeadMessageRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private emailService: IEmailService,
  ) {}

  async execute(input: PostStaffMessageInput): Promise<LeadMessage> {
    const trimmedBody = input.body.trim()

    if (trimmedBody.length === 0) {
      throw new Error('Message body cannot be empty')
    }

    if (trimmedBody.length > 2000) {
      throw new Error('Message body cannot exceed 2000 characters')
    }

    const message = LeadMessage.create({
      leadId: input.lead.id,
      authorType: 'staff',
      authorId: input.authorId,
      body: trimmedBody,
    })
    await this.leadMessageRepository.save(message)

    const activity = LeadActivity.create({
      leadId: input.lead.id,
      type: 'message_sent',
      payload: { messageId: message.id },
      createdBy: input.authorId,
    })
    await this.leadActivityRepository.save(activity)

    try {
      await this.emailService.sendNewMessageNotificationToClient(input.quote)
    } catch (error) {
      // The message is already persisted — a failed notification email must not
      // fail the request. Log server-side and move on.
      console.error(`Failed to send new-message client notification for lead ${input.lead.id}:`, error)
    }

    return message
  }
}
