import { Quote } from '@/core/entities/Quote'
import { Email } from '@/core/value-objects/Email'
import { Phone } from '@/core/value-objects/Phone'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'

export interface UpdateQuoteContactInput {
  name: string
  email: string
  phone?: string
}

export class UpdateQuoteContactUseCase {
  constructor(private quoteRepository: IQuoteRepository) {}

  async execute(quoteId: string, input: UpdateQuoteContactInput): Promise<Quote> {
    const quote = await this.quoteRepository.findById(quoteId)
    if (!quote) throw new Error('Quote not found')

    const updated = quote.withContact({
      name: input.name.trim(),
      email: Email.create(input.email),
      phone: Phone.create(input.phone),
    })

    await this.quoteRepository.update(updated)
    return updated
  }
}
