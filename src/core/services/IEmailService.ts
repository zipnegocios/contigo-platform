import { Quote } from '../entities/Quote'
import { Lead } from '../entities/Lead'
import { LeadEvent } from '../entities/LeadEvent'

export interface IEmailService {
  sendQuoteConfirmation(quote: Quote): Promise<void>
  sendAdminNotification(quote: Quote): Promise<void>
  sendNewMessageNotificationToAdmin(lead: Lead, quote: Quote): Promise<void>
  sendNewMessageNotificationToClient(quote: Quote): Promise<void>
  sendStageChangeNotificationToClient(quote: Quote, stageLabel: string): Promise<void>
  sendStageChangeNotificationToAdmin(lead: Lead, quote: Quote, fromLabel: string, toLabel: string): Promise<void>
  sendEventScheduledNotificationToClient(quote: Quote, event: LeadEvent): Promise<void>
  sendEventScheduledNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void>
  sendEventUpdatedNotificationToClient(quote: Quote, event: LeadEvent): Promise<void>
  sendEventUpdatedNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void>
  sendEventCancelledNotificationToClient(quote: Quote, event: LeadEvent): Promise<void>
  sendEventCancelledNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void>
}
