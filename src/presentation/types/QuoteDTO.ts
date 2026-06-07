import { QuoteStatus } from '@/core/entities/Quote'
import { Quote } from '@/core/entities/Quote'

export interface QuoteDTO {
  id: string
  name: string
  email: string
  phone: string | null
  service: string
  message: string
  trackingToken: string
  status: QuoteStatus
  attachmentUrls: string[]
  createdAt: Date
  updatedAt: Date
}

export function toQuoteDTO(quote: Quote): QuoteDTO {
  return {
    id: quote.id,
    name: quote.name,
    email: quote.email.toString(),
    phone: quote.phone?.toString() ?? null,
    service: quote.service,
    message: quote.message,
    trackingToken: quote.trackingToken,
    status: quote.status,
    attachmentUrls: quote.attachmentUrls,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  }
}
