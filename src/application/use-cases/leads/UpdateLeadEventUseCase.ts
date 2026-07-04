import { LeadEvent, LeadEventMetadata } from '@/core/entities/LeadEvent'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { IEmailService } from '@/core/services/IEmailService'

export class UpdateLeadEventUseCase {
  constructor(
    private leadEventRepository: ILeadEventRepository,
    private leadRepository: ILeadRepository,
    private quoteRepository: IQuoteRepository,
    private emailService: IEmailService,
  ) {}

  async execute(
    eventId: string,
    input: { scheduledAt?: Date; durationMinutes?: number; notes?: string | null; metadata?: LeadEventMetadata },
  ): Promise<LeadEvent> {
    const event = await this.leadEventRepository.findById(eventId)
    if (!event) throw new Error('Lead event not found')

    let updated = event.withDetails({ scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes, notes: input.notes })
    if (input.metadata) {
      updated = updated.withMetadata(input.metadata)
    }
    await this.leadEventRepository.update(updated)

    const lead = await this.leadRepository.findById(updated.leadId)
    const quote = lead ? await this.quoteRepository.findById(lead.quoteId) : null

    if (lead && quote) {
      try {
        await this.emailService.sendEventUpdatedNotificationToClient(quote, updated)
      } catch (error) {
        console.error(`Failed to send event-updated client notification for lead ${updated.leadId}:`, error)
      }

      try {
        await this.emailService.sendEventUpdatedNotificationToAdmin(lead, quote, updated)
      } catch (error) {
        console.error(`Failed to send event-updated admin notification for lead ${updated.leadId}:`, error)
      }
    } else {
      console.warn(`No lead/quote found for lead ${updated.leadId} — skipping event-updated emails`)
    }

    return updated
  }
}
