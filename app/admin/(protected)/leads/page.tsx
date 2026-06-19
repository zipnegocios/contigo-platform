import { LeadsKanban } from '@/presentation/components/admin/LeadsKanban'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'

export default async function LeadsPage() {
  const leadRepo = new DrizzleLeadRepository()
  const quoteRepo = new DrizzleQuoteRepository()

  const allLeads = await leadRepo.findAll(1000)

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
      <div>
        <h1 className="text-fluid-3xl font-bold text-gray-900">Leads Pipeline</h1>
        <p className="text-gray-600 mt-2">Drag leads across stages to update their status</p>
      </div>

      <LeadsKanban leads={leads} />
    </div>
  )
}
