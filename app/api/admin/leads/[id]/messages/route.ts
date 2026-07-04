import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { PostStaffMessageUseCase } from '@/application/use-cases/leads/PostStaffMessageUseCase'

const PostMessageSchema = z.object({
  body: z.string(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const leadMessageRepository = new DrizzleLeadMessageRepository()

    // Staff is viewing the thread, so client-authored messages become read.
    await leadMessageRepository.markAsRead(id, 'client')

    const messages = await leadMessageRepository.findByLeadId(id)

    return Response.json({ messages })
  } catch (error) {
    console.error('Error fetching lead messages:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const lead = await new DrizzleLeadRepository().findById(id)
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })

    const quote = await new DrizzleQuoteRepository().findById(lead.quoteId)
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 })

    const body = await request.json()
    const { body: messageBody } = PostMessageSchema.parse(body)

    const useCase = new PostStaffMessageUseCase(
      new DrizzleLeadMessageRepository(),
      new DrizzleLeadActivityRepository(),
      new ResendEmailService(),
    )

    const message = await useCase.execute({ lead, quote, body: messageBody, authorId: userId })

    return Response.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error posting lead message:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
