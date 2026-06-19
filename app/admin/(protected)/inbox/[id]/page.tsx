import { notFound } from 'next/navigation'
import { QuoteDetailPanel } from '@/presentation/components/admin/QuoteDetailPanel'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quoteRepo = new DrizzleQuoteRepository()
  const quote = await quoteRepo.findById(id)

  if (!quote) {
    notFound()
  }

  const leadRepo = new DrizzleLeadRepository()
  const lead = await leadRepo.findByQuoteId(quote.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-fluid-3xl font-bold">Quote from {quote.name}</h1>
        <p className="text-muted-foreground">Track and manage this quote</p>
      </div>

      <QuoteDetailPanel quote={toQuoteDTO(quote)} initialNotes={lead?.adminNotes || undefined} />
    </div>
  )
}
