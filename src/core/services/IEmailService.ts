import { Quote } from '../entities/Quote'

export interface IEmailService {
  sendQuoteConfirmation(quote: Quote): Promise<void>
  sendAdminNotification(quote: Quote): Promise<void>
}
