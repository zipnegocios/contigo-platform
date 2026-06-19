'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'

interface QuoteInboxTableProps {
  quotes: QuoteDTO[]
  onFilterChange?: (status: string) => void
}

const statusStyles: Record<string, { backgroundColor: string; color: string }> = {
  new: { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A08040' },
  contacted: { backgroundColor: 'rgba(228,193,92,0.2)', color: '#7A5C00' },
  in_progress: { backgroundColor: 'rgba(13,60,76,0.12)', color: '#0D3C4C' },
  converted: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' },
  closed: { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' },
}

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide"
      style={style}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

export function QuoteInboxTable({ quotes, onFilterChange }: QuoteInboxTableProps) {
  const [filter, setFilter] = useState<string>('all')

  const handleFilterChange = (value: string) => {
    setFilter(value)
    onFilterChange?.(value)
  }

  const filteredQuotes = filter === 'all' ? quotes : quotes.filter((q) => q.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2
          className="text-fluid-2xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
        >
          Quote Inbox
        </h2>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-48 text-fluid-sm" style={{ borderColor: 'var(--neutral-200)' }}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quotes</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
              <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Status</TableHead>
              <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Date</TableHead>
              <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                  No quotes found
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #F0E8DC' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-50)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{quote.name}</TableCell>
                  <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{quote.email.toString()}</TableCell>
                  <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{quote.service}</TableCell>
                  <TableCell className="py-3.5">
                    <StatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>
                    {quote.createdAt.toLocaleDateString()}
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
                      <Link href={`/admin/inbox/${quote.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
