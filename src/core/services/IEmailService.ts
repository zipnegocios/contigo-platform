import { Quote } from '../entities/Quote'
import { Lead } from '../entities/Lead'

export interface IEmailService {
  sendQuoteConfirmation(quote: Quote): Promise<void>
  sendAdminNotification(quote: Quote): Promise<void>
  sendNewMessageNotificationToAdmin(lead: Lead, quote: Quote): Promise<void>
  sendNewMessageNotificationToClient(quote: Quote): Promise<void>
}
