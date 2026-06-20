'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Trash2 } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'

export function LeadsViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams?.get('view') ?? 'kanban'
  const isTrash = searchParams?.get('trash') === '1'

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('view', view)
    params.delete('trash')
    router.push(`/admin/leads?${params.toString()}`)
  }

  const showTrash = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('trash', '1')
    router.push(`/admin/leads?${params.toString()}`)
  }

  return (
    <div className="flex rounded-lg border p-1">
      <Button variant={!isTrash && current === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
        <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
      </Button>
      <Button variant={!isTrash && current === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')}>
        <List className="h-4 w-4 mr-1" /> Table
      </Button>
      <Button variant={isTrash ? 'secondary' : 'ghost'} size="sm" onClick={showTrash}>
        <Trash2 className="h-4 w-4 mr-1" /> Trash
      </Button>
    </div>
  )
}
