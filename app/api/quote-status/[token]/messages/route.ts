import { z } from 'zod'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { PostClientMessageUseCase } from '@/application/use-cases/portal/PostClientMessageUseCase'
import { LeadMessage } from '@/core/entities/LeadMessage'

const PostMessageSchema = z.object({
  body: z.string(),
})

function toPublicMessageDTO(message: LeadMessage) {
  return {
    id: message.id,
    authorType: message.authorType,
    body: message.body,
    createdAt: message.createdAt,
  }
}

// Public, unauthenticated endpoint reached via a capability URL (tracking token).
// Every failure case below returns 404 — never 403 — so an attacker probing
// tokens cannot distinguish "exists but forbidden" from "doesn't exist".
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const quote = await new DrizzleQuoteRepository().findByToken(token)
    if (!quote) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const lead = await new DrizzleLeadRepository().findByQuoteId(quote.id)
    if (!lead) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const leadMessageRepository = new DrizzleLeadMessageRepository()

    // The client is viewing the thread, so staff-authored messages become read.
    await leadMessageRepository.markAsRead(lead.id, 'staff')

    const messages = await leadMessageRepository.findByLeadId(lead.id)

    return Response.json({ messages: messages.map(toPublicMessageDTO) })
  } catch (error) {
    console.error('Error fetching tracking panel messages:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const quote = await new DrizzleQuoteRepository().findByToken(token)
    if (!quote) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const lead = await new DrizzleLeadRepository().findByQuoteId(quote.id)
    if (!lead) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { body: messageBody } = PostMessageSchema.parse(body)

    const useCase = new PostClientMessageUseCase(
      new DrizzleLeadMessageRepository(),
      new DrizzleLeadActivityRepository(),
      new ResendEmailService(),
    )

    const message = await useCase.execute({ lead, quote, body: messageBody })

    return Response.json({ message: toPublicMessageDTO(message) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error posting tracking panel message:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
