import { Quote, CreateQuoteInput } from '@/core/entities/Quote'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { IEmailService } from '@/core/services/IEmailService'
import { IEmbeddingService } from '@/core/services/IEmbeddingService'

export class CreateQuoteUseCase {
  constructor(
    private quoteRepository: IQuoteRepository,
    private emailService: IEmailService,
    private embeddingService: IEmbeddingService,
  ) {}

  async execute(input: CreateQuoteInput): Promise<string> {
    // Create domain entity
    const quote = Quote.create(input)

    // Save to database immediately (don't wait for embedding)
    await this.quoteRepository.save(quote)

    // Send emails synchronously (user gets feedback quickly)
    await Promise.all([
      this.emailService.sendQuoteConfirmation(quote),
      this.emailService.sendAdminNotification(quote),
    ])

    // Generate embedding in background (fire-and-forget)
    this.generateEmbeddingAsync(quote).catch((err) => {
      console.error(`Failed to generate embedding for quote ${quote.id}:`, err)
    })

    return quote.trackingToken
  }

  private async generateEmbeddingAsync(quote: Quote): Promise<void> {
    try {
      const text = `${quote.name} ${quote.service} ${quote.message}`
      const embedding = await this.embeddingService.generateEmbedding(text)

      // Update quote with embedding in database
      const quoteWithEmbedding = quote as any
      quoteWithEmbedding.descriptionVector = embedding

      await this.quoteRepository.update(quoteWithEmbedding)
    } catch (error) {
      // Log but don't throw — embedding is optional
      console.error('Embedding generation failed:', error)
    }
  }
}
