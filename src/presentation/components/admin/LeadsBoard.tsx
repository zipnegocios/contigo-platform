'use client'

import { useState } from 'react'
import { LeadsKanban } from './LeadsKanban'
import { LeadsTable } from './LeadsTable'
import { LeadDetailModal } from './LeadDetailModal'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'

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
}

export function LeadsBoard({ view, leads: initialLeads }: LeadsBoardProps) {
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
        <LeadsTable leads={leads} />
      ) : (
        <LeadsKanban leads={leads} onLeadsChange={setLeads} />
      )}
      <LeadDetailModal onStageChange={handleStageChange} onLeadArchived={handleLeadArchived} />
    </>
  )
}
