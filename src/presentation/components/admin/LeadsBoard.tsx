'use client'

import { useState } from 'react'
import { LeadsKanban } from './LeadsKanban'
import { LeadsTable } from './LeadsTable'
import { LeadDetailModal } from './LeadDetailModal'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'
import type { PipelineStageDTO } from '@/presentation/types/PipelineStageDTO'

interface LeadRow {
  id: string
  quoteId: string
  stageId: string
  estimatedValue: number | null
  updatedAt: Date
  quote: QuoteDTO | null
}

interface LeadsBoardProps {
  view: string
  leads: LeadRow[]
  pipelineStages: PipelineStageDTO[]
  unreadByLead?: Record<string, number>
}

export function LeadsBoard({ view, leads: initialLeads, pipelineStages, unreadByLead = {} }: LeadsBoardProps) {
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads)

  const handleStageChange = (leadId: string, newStageId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stageId: newStageId, updatedAt: new Date() } : l)),
    )
  }

  const handleLeadArchived = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
  }

  return (
    <>
      {view === 'table' ? (
        <LeadsTable leads={leads} pipelineStages={pipelineStages} unreadByLead={unreadByLead} />
      ) : (
        <LeadsKanban leads={leads} onLeadsChange={setLeads} pipelineStages={pipelineStages} unreadByLead={unreadByLead} />
      )}
      <LeadDetailModal
        pipelineStages={pipelineStages}
        onStageChange={handleStageChange}
        onLeadArchived={handleLeadArchived}
      />
    </>
  )
}
