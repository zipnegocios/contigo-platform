'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'

interface CategoriesTrashViewProps {
  categories: Array<{ id: string; name: string; slug: string }>
}

export function CategoriesTrashView({ categories }: CategoriesTrashViewProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const restore = async (id: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/admin/categories/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Category restored')
      router.refresh()
    } catch {
      toast.error('Could not restore category')
    } finally {
      setRestoringId(null)
    }
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
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Slug</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => (
              <TableRow key={cat.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{cat.name}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm font-mono" style={{ color: '#6B6560' }}>{cat.slug}</TableCell>
                <TableCell className="py-3.5">
                  <Button size="sm" variant="outline" disabled={restoringId === cat.id} onClick={() => restore(cat.id)}>
                    Restore
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
