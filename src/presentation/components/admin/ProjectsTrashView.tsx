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

interface ProjectsTrashViewProps {
  projects: Array<{ id: string; title: string; coverImageUrl: string; category: string }>
}

export function ProjectsTrashView({ projects }: ProjectsTrashViewProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const restore = async (id: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/admin/projects/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Project restored')
      router.refresh()
    } catch {
      toast.error('Could not restore project')
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
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Title</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Category</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            projects.map((proj) => (
              <TableRow key={proj.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="py-3.5">
                  {proj.coverImageUrl ? (
                    <img src={proj.coverImageUrl} alt="" className="w-10 h-10 rounded object-cover" style={{ border: '1px solid #E5DDD0' }} />
                  ) : (
                    <div className="w-10 h-10 rounded" style={{ backgroundColor: 'rgba(226,192,99,0.12)' }} />
                  )}
                </TableCell>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{proj.title}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{proj.category}</TableCell>
                <TableCell className="py-3.5">
                  <Button size="sm" variant="outline" disabled={restoringId === proj.id} onClick={() => restore(proj.id)}>
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
