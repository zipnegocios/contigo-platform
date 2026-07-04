'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'
import type { PipelineStageDTO } from '@/presentation/types/PipelineStageDTO'
import { useAdminRealtimeMessages } from '@/presentation/providers/AdminRealtimeProvider'

interface LeadsTableProps {
  leads: Array<{
    id: string
    quoteId: string
    stageId: string
    estimatedValue: number | null
    updatedAt: Date
    quote: QuoteDTO | null
  }>
  pipelineStages: PipelineStageDTO[]
  unreadByLead?: Record<string, number>
}

/** Derives a readable text color + soft background tint from the stage's stored hex color. */
function stageBadgeColors(hexColor: string): { backgroundColor: string; color: string } {
  const hex = hexColor.replace('#', '')
  if (hex.length !== 6) {
    return { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }
  }
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return {
    backgroundColor: `rgba(${r},${g},${b},0.15)`,
    color: hexColor,
  }
}

function StageBadge({ stage }: { stage: PipelineStageDTO | undefined }) {
  if (!stage) {
    return (
      <span
        className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide"
        style={{ backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }}
      >
        Unknown
      </span>
    )
  }

  const { backgroundColor, color } = stageBadgeColors(stage.color)
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide"
      style={{ backgroundColor, color }}
    >
      {stage.label}
    </span>
  )
}

export function LeadsTable({ leads, pipelineStages, unreadByLead = {} }: LeadsTableProps) {
  const searchParams = useSearchParams()

  // Live source of truth: SSR-provided unreadByLead is only as fresh as the
  // last page load/navigation, and is shown only until the shared admin SSE
  // stream delivers its first snapshot. From then on the live byLead map is
  // a complete sparse map ("absent = 0 unread"), so it fully replaces the
  // SSR prop rather than being spread-merged with it — a spread-merge can
  // only add/override keys, never remove a stale nonzero SSR entry once a
  // lead's unread count drops to zero. Pure client-side state — no
  // router.refresh() here.
  const { byLead: liveByLead, connected } = useAdminRealtimeMessages()
  const effectiveUnreadByLead = connected ? liveByLead : unreadByLead

  const buildHref = (leadId: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('leadId', leadId)
    return `/admin/leads?${params.toString()}`
  }

  return (
    <div
      className="rounded-lg overflow-hidden bg-white"
      style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
    >
      <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid #E5DDD0' }}>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Name</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Email</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Service</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Stage</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Updated</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid #F0E8DC' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-50)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>
                  <div className="flex items-center gap-1.5">
                    <span>{lead.quote?.name || 'Unknown'}</span>
                    {effectiveUnreadByLead[lead.id] > 0 && (
                      <span
                        className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5"
                        style={{
                          minWidth: '18px',
                          height: '18px',
                          backgroundColor: 'rgba(226,192,99,0.2)',
                          color: '#A08040',
                        }}
                        title={`${effectiveUnreadByLead[lead.id]} unread message${effectiveUnreadByLead[lead.id] === 1 ? '' : 's'}`}
                      >
                        {effectiveUnreadByLead[lead.id]}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.email ?? '—'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.service ?? '—'}</TableCell>
                <TableCell className="py-3.5">
                  <StageBadge stage={pipelineStages.find((s) => s.id === lead.stageId)} />
                </TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>
                  {lead.updatedAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="py-3.5">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="text-fluid-xs min-h-[44px] transition-all duration-150"
                    style={{ borderColor: 'var(--neutral-200)', color: '#6B6560' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--contigo-primary)'
                      e.currentTarget.style.color = 'var(--contigo-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--neutral-200)'
                      e.currentTarget.style.color = '#6B6560'
                    }}
                  >
                    <Link href={buildHref(lead.id)}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
