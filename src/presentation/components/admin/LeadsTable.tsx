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

interface LeadsTableProps {
  leads: Array<{
    id: string
    quoteId: string
    stageId: string
    estimatedValue: number | null
    updatedAt: Date
    quote: QuoteDTO | null
  }>
}

// Mismos colores que stageConfig en LeadsKanban.tsx, para consistencia visual entre vistas
const stageBadgeStyles: Record<string, { label: string; backgroundColor: string; color: string }> = {
  prospect: { label: 'Prospect', backgroundColor: 'rgba(226,192,99,0.2)', color: '#A08040' },
  contacted: { label: 'Contacted', backgroundColor: 'rgba(228,193,92,0.2)', color: '#7A5C00' },
  quoted: { label: 'Quoted', backgroundColor: 'rgba(13,60,76,0.12)', color: '#0D3C4C' },
  won: { label: 'Won', backgroundColor: 'rgba(34,197,94,0.15)', color: '#15803d' },
  lost: { label: 'Lost', backgroundColor: 'rgba(107,101,96,0.12)', color: '#6B6560' },
}

function StageBadge({ stage }: { stage: string }) {
  const style = stageBadgeStyles[stage] ?? { label: stage, backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide"
      style={{ backgroundColor: style.backgroundColor, color: style.color }}
    >
      {style.label}
    </span>
  )
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const searchParams = useSearchParams()

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
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{lead.quote?.name || 'Unknown'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.email ?? '—'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.service ?? '—'}</TableCell>
                <TableCell className="py-3.5">
                  <StageBadge stage={lead.stageId} />
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
