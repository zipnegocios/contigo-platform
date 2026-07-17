import { z } from 'zod'
import { CreateQuoteUseCase } from '@/application/use-cases/CreateQuoteUseCase'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { OpenAIEmbeddingService } from '@/infrastructure/services/OpenAIEmbeddingService'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { CreateLeadForQuoteUseCase } from '@/application/use-cases/leads/CreateLeadForQuoteUseCase'

const CreateQuoteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(50).optional(),
  service: z.string().min(2, 'Please select a service').max(255),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  attachmentUrls: z.array(z.string()).max(3).optional().default([]),
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
    const leadRepository = new DrizzleLeadRepository()
    const leadActivityRepository = new DrizzleLeadActivityRepository()
    const leadContactRepository = new DrizzleLeadContactRepository()
    const pipelineStageRepository = new DrizzlePipelineStageRepository()
    const createLeadForQuote = new CreateLeadForQuoteUseCase(
      leadRepository,
      leadActivityRepository,
      leadContactRepository,
      pipelineStageRepository,
    )

    // Create and execute use case
    const useCase = new CreateQuoteUseCase(
      quoteRepository,
      emailService,
      embeddingService,
      createLeadForQuote,
    )
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
