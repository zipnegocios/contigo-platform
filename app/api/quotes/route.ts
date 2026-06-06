import { z } from 'zod'
import { CreateQuoteUseCase } from '@/application/use-cases/CreateQuoteUseCase'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { OpenAIEmbeddingService } from '@/infrastructure/services/OpenAIEmbeddingService'

const CreateQuoteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  service: z.string().min(2, 'Please select a service'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validatedInput = CreateQuoteSchema.parse(body)

    // Instantiate dependencies
    const quoteRepository = new DrizzleQuoteRepository()
    const emailService = new ResendEmailService()
    const embeddingService = new OpenAIEmbeddingService()

    // Create and execute use case
    const useCase = new CreateQuoteUseCase(quoteRepository, emailService, embeddingService)
    const trackingToken = await useCase.execute(validatedInput)

    return Response.json(
      {
        success: true,
        trackingToken,
        message: 'Quote submitted successfully. Check your email for tracking details.',
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          errors: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error('Quote creation error:', error)

    return Response.json(
      {
        success: false,
        message: 'Failed to submit quote. Please try again.',
      },
      { status: 500 },
    )
  }
}
