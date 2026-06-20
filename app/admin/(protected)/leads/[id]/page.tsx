import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { LeadDetailTabs } from '@/presentation/components/admin/LeadDetailTabs'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'
import { toLeadDTO } from '@/presentation/types/LeadDTO'
import { toLeadEventDTO } from '@/presentation/types/LeadEventDTO'
import { toLeadDocumentDTO } from '@/presentation/types/LeadDocumentDTO'
import { toLeadActivityDTO } from '@/presentation/types/LeadActivityDTO'
import { notFound } from 'next/navigation'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadRepo = new DrizzleLeadRepository()
  const lead = await leadRepo.findById(id)
  if (!lead) notFound()

  const [quote, events, documents, activities] = await Promise.all([
    new DrizzleQuoteRepository().findById(lead.quoteId),
    new DrizzleLeadEventRepository().findByLeadId(lead.id),
    new DrizzleLeadDocumentRepository().findByLeadId(lead.id),
    new DrizzleLeadActivityRepository().findByLeadId(lead.id),
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
      />
    </div>
  )
}
