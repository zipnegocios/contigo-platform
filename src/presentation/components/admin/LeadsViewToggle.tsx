'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Trash2, Archive } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'

export function LeadsViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams?.get('view') ?? 'kanban'
  const isTrash = searchParams?.get('trash') === '1'
  const isArchived = !isTrash && searchParams?.get('archived') === '1'

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('view', view)
    params.delete('trash')
    params.delete('archived')
    router.push(`/admin/leads?${params.toString()}`)
  }

  const showTrash = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('archived')
    params.set('trash', '1')
    router.push(`/admin/leads?${params.toString()}`)
  }

  const showArchived = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('trash')
    params.set('archived', '1')
    router.push(`/admin/leads?${params.toString()}`)
  }

  return (
    <div className="flex rounded-lg border p-1">
      <Button variant={!isTrash && !isArchived && current === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
        <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
      </Button>
      <Button variant={!isTrash && !isArchived && current === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')}>
        <List className="h-4 w-4 mr-1" /> Table
      </Button>
      <Button variant={isArchived ? 'secondary' : 'ghost'} size="sm" onClick={showArchived}>
        <Archive className="h-4 w-4 mr-1" /> Archive
      </Button>
      <Button variant={isTrash ? 'secondary' : 'ghost'} size="sm" onClick={showTrash}>
        <Trash2 className="h-4 w-4 mr-1" /> Trash
      </Button>
    </div>
  )
}
