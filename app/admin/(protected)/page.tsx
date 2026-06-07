import { DashboardView } from '@/presentation/components/admin/DashboardView'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'

export default async function AdminDashboardPage() {
  const quoteRepo = new DrizzleQuoteRepository()
  const projectRepo = new DrizzleProjectRepository()
  const leadRepo = new DrizzleLeadRepository()

  // Fetch data
  const totalQuotes = await quoteRepo.count()
  const newQuotes = await quoteRepo.countByStatus('new')
  const convertedQuotes = await quoteRepo.countByStatus('converted')
  const totalLeads = (await leadRepo.findAll(1000)).length
  const totalProjects = (await projectRepo.findPublished(1000)).length

  // Real quote counts per day for the last 7 days
  const quotesTrend = await quoteRepo.countByDay(7)

  return (
    <DashboardView
      totalQuotes={totalQuotes}
      newQuotes={newQuotes}
      convertedQuotes={convertedQuotes}
      totalLeads={totalLeads}
      totalProjects={totalProjects}
      quotesTrend={quotesTrend}
    />
  )
}
