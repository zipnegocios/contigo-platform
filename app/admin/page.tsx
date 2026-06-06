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

  // Generate trend data for last 7 days
  const quotesTrend = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      count: Math.floor(Math.random() * 10) + 1,
    }
  })

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
