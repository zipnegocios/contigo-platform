import { LeadsBoard } from '@/presentation/components/admin/LeadsBoard'
import { LeadsTrashView } from '@/presentation/components/admin/LeadsTrashView'
import { LeadsArchiveView } from '@/presentation/components/admin/LeadsArchiveView'
import { LeadsFilterBar } from '@/presentation/components/admin/LeadsFilterBar'
import { LeadsViewToggle } from '@/presentation/components/admin/LeadsViewToggle'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'
import { toPipelineStageDTO } from '@/presentation/types/PipelineStageDTO'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; from?: string; to?: string; trash?: string; archived?: string }>
}) {
  const { view = 'kanban', from, to, trash, archived } = await searchParams
  const isTrash = trash === '1'
  const isArchived = !isTrash && archived === '1'

  const leadRepo = new DrizzleLeadRepository()
  const quoteRepo = new DrizzleQuoteRepository()
  const pipelineStageRepo = new DrizzlePipelineStageRepository()

  const pipelineStages = (await pipelineStageRepo.findAll()).map(toPipelineStageDTO)
  const unreadByLead = await new DrizzleLeadMessageRepository().countUnreadGroupedByLead('client')

  const allLeads = isTrash
    ? await leadRepo.findAllFiltered({ onlyTrashed: true })
    : isArchived
      ? await leadRepo.findAllFiltered({ onlyArchived: true })
      : await leadRepo.findAllFiltered({
          createdFrom: from ? new Date(from) : undefined,
          createdTo: to ? new Date(to) : undefined,
        })

  const leads = await Promise.all(
    allLeads.map(async (lead) => {
      const quote = await quoteRepo.findById(lead.quoteId)
      return {
        id: lead.id,
        quoteId: lead.quoteId,
        stageId: lead.stageId,
        estimatedValue: lead.estimatedValue,
        updatedAt: lead.updatedAt,
        quote: quote ? toQuoteDTO(quote) : null,
      }
    }),
  )

  const title = isTrash ? 'Trash' : isArchived ? 'Archive' : 'Leads Pipeline'
  const subtitle = isTrash
    ? 'Trashed leads — restore them to bring them back to the pipeline.'
    : isArchived
      ? 'Archived leads — restore them to bring them back to the pipeline.'
      : 'Drag leads across stages to update their status'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-fluid-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        <LeadsViewToggle />
      </div>

      {!isTrash && !isArchived && <LeadsFilterBar />}

      {isTrash ? (
        <LeadsTrashView leads={leads} pipelineStages={pipelineStages} />
      ) : isArchived ? (
        <LeadsArchiveView leads={leads} pipelineStages={pipelineStages} />
      ) : (
        <LeadsBoard view={view} leads={leads} pipelineStages={pipelineStages} unreadByLead={unreadByLead} />
      )}
    </div>
  )
}
