'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'

export function LeadsViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams?.get('view') ?? 'kanban'

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('view', view)
    router.push(`/admin/leads?${params.toString()}`)
  }

  return (
    <div className="flex rounded-lg border p-1">
      <Button variant={current === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
        <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
      </Button>
      <Button variant={current === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')}>
        <List className="h-4 w-4 mr-1" /> Table
      </Button>
    </div>
  )
}
