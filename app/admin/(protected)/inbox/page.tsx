import { QuoteInboxTable } from '@/presentation/components/admin/QuoteInboxTable'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'

export default async function InboxPage() {
  const quoteRepo = new DrizzleQuoteRepository()
  const quotes = await quoteRepo.findAll(100)
  const dtos = quotes.map(toQuoteDTO)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p className="text-muted-foreground">Manage all incoming quotes and track their status.</p>
      </div>

      <QuoteInboxTable quotes={dtos} />
    </div>
  )
}
