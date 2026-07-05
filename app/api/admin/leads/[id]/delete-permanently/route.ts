import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleTaskAttachmentRepository } from '@/infrastructure/repositories/DrizzleTaskAttachmentRepository'
import { DeleteLeadPermanentlyUseCase } from '@/application/use-cases/leads/DeleteLeadPermanentlyUseCase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.delete'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const useCase = new DeleteLeadPermanentlyUseCase(
      new DrizzleLeadRepository(),
      new DrizzleQuoteRepository(),
      new DrizzleLeadDocumentRepository(),
      new DrizzleTaskAttachmentRepository(),
    )
    await useCase.execute(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting lead:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Lead not found' || message === 'Quote not found' ? 404 : 500
    return Response.json({ error: message }, { status })
  }
}
