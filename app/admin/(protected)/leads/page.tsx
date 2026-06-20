import { LeadsKanban } from '@/presentation/components/admin/LeadsKanban'
import { LeadsTable } from '@/presentation/components/admin/LeadsTable'
import { LeadsFilterBar } from '@/presentation/components/admin/LeadsFilterBar'
import { LeadsViewToggle } from '@/presentation/components/admin/LeadsViewToggle'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; from?: string; to?: string }>
}) {
  const { view = 'kanban', from, to } = await searchParams

  const leadRepo = new DrizzleLeadRepository()
  const quoteRepo = new DrizzleQuoteRepository()

  const allLeads = await leadRepo.findAllFiltered({
    createdFrom: from ? new Date(from) : undefined,
    createdTo: to ? new Date(to) : undefined,
  })

  const leads = await Promise.all(
    allLeads.map(async (lead) => {
      const quote = await quoteRepo.findById(lead.quoteId)
      return {
        id: lead.id,
        quoteId: lead.quoteId,
        stage: lead.stage,
        adminNotes: lead.adminNotes,
        estimatedValue: lead.estimatedValue,
        updatedAt: lead.updatedAt,
        quote: quote ? toQuoteDTO(quote) : null,
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-fluid-3xl font-bold text-gray-900">Leads Pipeline</h1>
          <p className="text-gray-600 mt-2">Drag leads across stages to update their status</p>
        </div>
        <LeadsViewToggle />
      </div>

      <LeadsFilterBar />

      {view === 'table' ? <LeadsTable leads={leads} /> : <LeadsKanban leads={leads} />}
    </div>
  )
}
