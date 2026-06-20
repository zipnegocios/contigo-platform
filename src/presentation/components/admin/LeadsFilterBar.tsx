'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Calendar } from '@/presentation/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/presentation/components/ui/popover'
import { Button } from '@/presentation/components/ui/button'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

const presets = [
  { label: 'Hoy', getRange: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Últimos 7 días', getRange: () => ({ from: new Date(Date.now() - 6 * 86400000), to: new Date() }) },
  { label: 'Este mes', getRange: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() }) },
]

export function LeadsFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [range, setRange] = useState<DateRange | undefined>()

  const applyRange = (r: DateRange | undefined) => {
    setRange(r)
    const params = new URLSearchParams(searchParams?.toString())
    if (r?.from) params.set('from', r.from.toISOString().split('T')[0])
    else params.delete('from')
    if (r?.to) params.set('to', r.to.toISOString().split('T')[0])
    else params.delete('to')
    router.push(`/admin/leads?${params.toString()}`)
  }

  const clear = () => applyRange(undefined)

  return (
    <div className="flex items-center gap-2">
      {presets.map((p) => (
        <Button key={p.label} variant="outline" size="sm" onClick={() => applyRange(p.getRange())}>
          {p.label}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            {range?.from
              ? `${range.from.toLocaleDateString()}${range.to ? ' – ' + range.to.toLocaleDateString() : ''}`
              : 'Rango de fechas'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="range" selected={range} onSelect={applyRange} numberOfMonths={2} />
        </PopoverContent>
      </Popover>

      {(searchParams?.get('from') || searchParams?.get('to')) && (
        <Button variant="ghost" size="sm" onClick={clear} className="gap-1">
          <X className="h-3 w-3" /> Limpiar
        </Button>
      )}
    </div>
  )
}
