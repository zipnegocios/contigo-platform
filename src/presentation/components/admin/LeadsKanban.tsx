'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'

type LeadRow = {
  id: string
  quoteId: string
  stage: string
  estimatedValue: number | null
  updatedAt: Date
  quote: QuoteDTO | null
}

interface LeadsKanbanProps {
  leads: LeadRow[]
  onLeadsChange: (updater: (prev: LeadRow[]) => LeadRow[]) => void
}

const stages = ['prospect', 'contacted', 'quoted', 'won', 'lost']

const stageConfig: Record<string, {
  label: string
  columnBg: string
  borderColor: string
  headerColor: string
  badgeBg: string
  badgeText: string
}> = {
  prospect: {
    label: 'Prospect',
    columnBg: 'rgba(226,192,99,0.05)',
    borderColor: 'rgba(226,192,99,0.25)',
    headerColor: 'var(--contigo-primary)',
    badgeBg: 'rgba(226,192,99,0.2)',
    badgeText: '#A08040',
  },
  contacted: {
    label: 'Contacted',
    columnBg: 'rgba(228,193,92,0.06)',
    borderColor: 'rgba(228,193,92,0.28)',
    headerColor: '#C8A55C',
    badgeBg: 'rgba(228,193,92,0.2)',
    badgeText: '#7A5C00',
  },
  quoted: {
    label: 'Quoted',
    columnBg: 'rgba(13,60,76,0.04)',
    borderColor: 'rgba(13,60,76,0.18)',
    headerColor: '#0D3C4C',
    badgeBg: 'rgba(13,60,76,0.12)',
    badgeText: '#0D3C4C',
  },
  won: {
    label: 'Won',
    columnBg: 'rgba(34,197,94,0.04)',
    borderColor: 'rgba(34,197,94,0.22)',
    headerColor: '#15803d',
    badgeBg: 'rgba(34,197,94,0.15)',
    badgeText: '#15803d',
  },
  lost: {
    label: 'Lost',
    columnBg: 'rgba(107,101,96,0.06)',
    borderColor: 'rgba(107,101,96,0.18)',
    headerColor: '#6B6560',
    badgeBg: 'rgba(107,101,96,0.12)',
    badgeText: '#6B6560',
  },
}

export function LeadsKanban({ leads, onLeadsChange }: LeadsKanbanProps) {
  const searchParams = useSearchParams()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const buildHref = (leadId: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('leadId', leadId)
    return `/admin/leads?${params.toString()}`
  }

  const groupedByStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage)
      return acc
    },
    {} as Record<string, LeadRow[]>,
  )

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    if (!draggedId || isLoading) return

    const lead = leads.find((l) => l.id === draggedId)
    if (!lead || lead.stage === targetStage) {
      setDraggedId(null)
      return
    }

    const originalLeads = leads
    onLeadsChange((prev) =>
      prev.map((l) =>
        l.id === draggedId ? { ...l, stage: targetStage, updatedAt: new Date() } : l,
      ),
    )
    setDraggedId(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/leads/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      })

      if (!response.ok) throw new Error(`Failed to update lead: ${response.statusText}`)

      toast.success(`Lead moved to ${stageConfig[targetStage].label}`)
    } catch (error) {
      onLeadsChange(() => originalLeads)
      toast.error(error instanceof Error ? error.message : 'Failed to move lead')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1
        className="text-fluid-4xl font-semibold mb-6"
        style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)', lineHeight: 1.2 }}
      >
        Lead Pipeline
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const cfg = stageConfig[stage]
          const stagLeads = groupedByStage[stage]

          return (
            <div key={stage} className="flex flex-col">
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <span
                  className="text-fluid-xs font-semibold uppercase tracking-wider"
                  style={{ color: cfg.headerColor }}
                >
                  {cfg.label}
                </span>
                <span
                  className="text-fluid-xs font-bold rounded-full px-2 py-0.5"
                  style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}
                >
                  {stagLeads.length}
                </span>
              </div>

              {/* Column accent line */}
              <div
                className="h-0.5 mb-3 rounded-full"
                style={{ backgroundColor: cfg.headerColor, opacity: 0.4 }}
              />

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="flex-1 space-y-3 p-3 rounded-xl border-2 border-dashed transition-all min-h-96"
                style={{
                  backgroundColor: cfg.columnBg,
                  borderColor: cfg.borderColor,
                }}
              >
                {stagLeads.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-28 text-fluid-xs"
                    style={{ color: 'var(--neutral-600)' }}
                  >
                    Drop here
                  </div>
                ) : (
                  stagLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all"
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5DDD0',
                        boxShadow: '0 1px 4px rgba(45,41,36,0.06)',
                        opacity: draggedId === lead.id ? 0.45 : 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(45,41,36,0.12)'
                        e.currentTarget.style.borderColor = cfg.borderColor
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(45,41,36,0.06)'
                        e.currentTarget.style.borderColor = 'var(--neutral-200)'
                      }}
                    >
                      <Link href={buildHref(lead.id)} className="block space-y-2">
                        <div>
                          <p className="font-semibold text-fluid-sm truncate" style={{ color: 'var(--neutral-800)' }}>
                            {lead.quote?.name || 'Unknown'}
                          </p>
                          <p className="text-fluid-xs truncate" style={{ color: 'var(--neutral-600)' }}>
                            {lead.quote?.email ?? '—'}
                          </p>
                        </div>

                        {lead.quote?.service && (
                          <span
                            className="inline-block text-fluid-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#A08040' }}
                          >
                            {lead.quote.service}
                          </span>
                        )}

                        {lead.estimatedValue && (
                          <div
                            className="flex items-center justify-between pt-2"
                            style={{ borderTop: '1px solid #F0E8DC' }}
                          >
                            <span className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>Est. Value</span>
                            <span
                              className="text-fluid-xs font-bold"
                              style={{ fontFamily: 'var(--font-space)', color: '#15803d' }}
                            >
                              ${(lead.estimatedValue / 100).toFixed(0)}
                            </span>
                          </div>
                        )}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
