'use client'

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
import { Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Project {
  id: string
  title: string
  slug: string
  category: string
  featured: boolean
  published: boolean
}

interface ProjectTableProps {
  projects: Project[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Project deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete project')
      console.error(error)
    } finally {
      setDeleting(null)
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
            <TableHead className="text-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Title</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Category</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Status</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Featured</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-sm" style={{ color: 'var(--neutral-600)' }}>
                No projects yet.{' '}
                <Link href="/admin/projects/new" style={{ color: 'var(--contigo-primary)', textDecoration: 'underline' }}>
                  Create one
                </Link>
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow
                key={project.id}
                style={{ borderBottom: '1px solid #F0E8DC' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-50)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>
                  {project.title}
                </TableCell>
                <TableCell className="py-3.5 text-sm" style={{ color: '#6B6560' }}>
                  {project.category}
                </TableCell>
                <TableCell className="py-3.5">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide"
                    style={
                      project.published
                        ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' }
                        : { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }
                    }
                  >
                    {project.published ? 'Published' : 'Draft'}
                  </span>
                </TableCell>
                <TableCell className="py-3.5">
                  {project.featured ? (
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A08040' }}
                    >
                      Featured
                    </span>
                  ) : (
                    <span style={{ color: 'var(--neutral-200)' }}>—</span>
                  )}
                </TableCell>
                <TableCell className="py-3.5">
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 transition-all duration-150"
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
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 transition-all duration-150"
                      style={{ borderColor: 'var(--neutral-200)', color: '#6B6560' }}
                      onClick={() => handleDelete(project.id)}
                      disabled={deleting === project.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#dc2626'
                        e.currentTarget.style.color = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--neutral-200)'
                        e.currentTarget.style.color = '#6B6560'
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
