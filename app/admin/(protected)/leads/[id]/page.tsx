import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { DrizzleLeadNoteRepository } from '@/infrastructure/repositories/DrizzleLeadNoteRepository'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { LeadDetailTabs } from '@/presentation/components/admin/LeadDetailTabs'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'
import { toLeadDTO } from '@/presentation/types/LeadDTO'
import { toLeadEventDTO } from '@/presentation/types/LeadEventDTO'
import { toLeadDocumentDTO } from '@/presentation/types/LeadDocumentDTO'
import { toLeadActivityDTO } from '@/presentation/types/LeadActivityDTO'
import { toLeadNoteDTO } from '@/presentation/types/LeadNoteDTO'
import { toLeadContactDTO } from '@/presentation/types/LeadContactDTO'
import { toPipelineStageDTO } from '@/presentation/types/PipelineStageDTO'
import { notFound } from 'next/navigation'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadRepo = new DrizzleLeadRepository()
  const lead = await leadRepo.findById(id)
  if (!lead) notFound()

  const [quote, events, documents, activities, notes, contacts, pipelineStages] = await Promise.all([
    new DrizzleQuoteRepository().findById(lead.quoteId),
    new DrizzleLeadEventRepository().findByLeadId(lead.id),
    new DrizzleLeadDocumentRepository().findByLeadId(lead.id),
    new DrizzleLeadActivityRepository().findByLeadId(lead.id),
    new DrizzleLeadNoteRepository().findByLeadId(lead.id),
    new DrizzleLeadContactRepository().findByLeadId(lead.id),
    new DrizzlePipelineStageRepository().findAll(),
  ])

  if (!quote) notFound()

  const quoteDto = toQuoteDTO(quote)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{quote.name}</h1>
        <p className="text-muted-foreground">{quote.service}</p>
      </div>

      <LeadDetailTabs
        lead={toLeadDTO(lead)}
        quote={quoteDto}
        events={events.map(toLeadEventDTO)}
        documents={documents.map(toLeadDocumentDTO)}
        activities={activities.map(toLeadActivityDTO)}
        notes={notes.map(toLeadNoteDTO)}
        contacts={contacts.map(toLeadContactDTO)}
        pipelineStages={pipelineStages.map(toPipelineStageDTO)}
      />
    </div>
  )
}
