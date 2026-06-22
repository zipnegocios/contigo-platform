import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { DrizzleLeadNoteRepository } from '@/infrastructure/repositories/DrizzleLeadNoteRepository'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { ChangeLeadStageUseCase } from '@/application/use-cases/leads/ChangeLeadStageUseCase'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'
import { toLeadDTO } from '@/presentation/types/LeadDTO'
import { toLeadEventDTO } from '@/presentation/types/LeadEventDTO'
import { toLeadDocumentDTO } from '@/presentation/types/LeadDocumentDTO'
import { toLeadActivityDTO } from '@/presentation/types/LeadActivityDTO'
import { toLeadNoteDTO } from '@/presentation/types/LeadNoteDTO'
import { toLeadContactDTO } from '@/presentation/types/LeadContactDTO'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leadRepo = new DrizzleLeadRepository()
    const lead = await leadRepo.findById(params.id)
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })

    const [quote, events, documents, activities, notes, contacts] = await Promise.all([
      new DrizzleQuoteRepository().findById(lead.quoteId),
      new DrizzleLeadEventRepository().findByLeadId(lead.id),
      new DrizzleLeadDocumentRepository().findByLeadId(lead.id),
      new DrizzleLeadActivityRepository().findByLeadId(lead.id),
      new DrizzleLeadNoteRepository().findByLeadId(lead.id),
      new DrizzleLeadContactRepository().findByLeadId(lead.id),
    ])

    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 })

    return Response.json({
      lead: toLeadDTO(lead),
      quote: toQuoteDTO(quote),
      events: events.map(toLeadEventDTO),
      documents: documents.map(toLeadDocumentDTO),
      activities: activities.map(toLeadActivityDTO),
      notes: notes.map(toLeadNoteDTO),
      contacts: contacts.map(toLeadContactDTO),
    })
  } catch (error) {
    console.error('Error fetching lead detail:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { stageId } = body

    if (!stageId) {
      return Response.json({ error: 'stageId is required' }, { status: 400 })
    }

    const leadRepo = new DrizzleLeadRepository()
    const existingLead = await leadRepo.findById(params.id)

    if (!existingLead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 })
    }

    const changeLeadStageUseCase = new ChangeLeadStageUseCase(
      leadRepo,
      new DrizzleLeadActivityRepository(),
      new DrizzlePipelineStageRepository(),
    )

    const updatedLead = await changeLeadStageUseCase.execute(
      params.id,
      stageId as string,
      (session.user as any)?.id,
    )

    return Response.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
