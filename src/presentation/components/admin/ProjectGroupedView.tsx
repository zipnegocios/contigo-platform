'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Trash2, GripVertical, Pencil, ExternalLink } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { StatusMenu } from './StatusMenu'
import type { ContentStatus } from '@/types/status'

export interface ProjectGroupItem {
  id: string
  title: string
  slug: string
  orderIndex: number
  status: ContentStatus
  featured: boolean
  coverImageUrl: string
  categoryId: string | null
  categorySlug: string
}

export interface ProjectGroup {
  categoryId: string | null
  categoryName: string
  projects: ProjectGroupItem[]
}

interface ProjectGroupedViewProps {
  groups: ProjectGroup[]
}

function CategorySection({ group }: { group: ProjectGroup }) {
  const router = useRouter()
  const [items, setItems] = useState(group.projects)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const initialOrder = group.projects.map((p) => p.id)
  const hasChanges = items.some((p, i) => p.id !== initialOrder[i])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer!.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const from = items.findIndex((p) => p.id === draggedId)
    const to = items.findIndex((p) => p.id === targetId)
    const next = [...items]
    next.splice(to, 0, next.splice(from, 1)[0])
    next.forEach((p, i) => { p.orderIndex = i })
    setItems(next)
    setDraggedId(null)
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: items.map((p) => ({ id: p.id, orderIndex: p.orderIndex })) }),
      })
      if (!res.ok) throw new Error('Failed to save order')
      toast.success('Order saved')
      router.refresh()
    } catch {
      toast.error('Failed to save order')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Move this project to trash?')) return
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project moved to trash')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    const previous = items
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`Set to ${status}`)
    } catch {
      setItems(previous)
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-fluid-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
            {group.categoryName}
          </h2>
          <span
            className="px-2 py-0.5 rounded-full text-fluid-xs font-medium"
            style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A' }}
          >
            {items.length}
          </span>
        </div>
        <Link
          href={group.categoryId ? `/admin/projects/new?categoryId=${group.categoryId}` : '/admin/projects/new'}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1 transition-all duration-150"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          + Add project
        </Link>
      </div>

      <div
        className="rounded-lg overflow-hidden bg-white"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 1px 4px rgba(45,41,36,0.05)' }}
      >
        {items.length === 0 ? (
          <div className="py-10 text-center text-fluid-sm" style={{ color: '#9C8F83' }}>
            No projects in this category yet.
          </div>
        ) : (
          <ul>
            {items.map((proj, idx) => (
              <li
                key={proj.id}
                draggable
                onDragStart={(e) => handleDragStart(e, proj.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, proj.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-move"
                style={{
                  borderBottom: idx < items.length - 1 ? '1px solid #F5EFE8' : 'none',
                  opacity: draggedId === proj.id ? 0.4 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: '#C5BDB5' }} />

                {proj.coverImageUrl ? (
                  <img
                    src={proj.coverImageUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    style={{ border: '1px solid #E5DDD0' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#E2C063', fontSize: '1rem', fontWeight: 700 }}
                  >
                    {proj.title.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-fluid-sm font-medium truncate" style={{ color: '#2D2924' }}>{proj.title}</p>
                </div>

                {proj.featured && (
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A08040' }}
                  >
                    Featured
                  </span>
                )}

                <StatusMenu status={proj.status} onChange={(status) => handleStatusChange(proj.id, status)} />

                <div className="flex gap-1 flex-shrink-0">
                  {proj.status === 'active' ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                      style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                    >
                      <a href={`/projects/${proj.categorySlug}/${proj.slug}`} target="_blank" rel="noopener noreferrer" title="View live page">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="min-h-[36px] min-w-[36px] p-0 opacity-40 cursor-not-allowed"
                      style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                      title="Only Active projects have a public page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                  >
                    <Link href={`/admin/projects/${proj.id}/edit`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                    onClick={() => handleDelete(proj.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#dc2626'
                      e.currentTarget.style.color = '#dc2626'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5DDD0'
                      e.currentTarget.style.color = '#6B6560'
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasChanges && (
        <button
          onClick={handleSaveOrder}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-fluid-xs font-semibold transition-all min-h-[36px]"
          style={{
            backgroundColor: saving ? '#C8A55C' : '#E2C063',
            color: '#1E1A16',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save Order'}
        </button>
      )}
    </div>
  )
}

export function ProjectGroupedView({ groups }: ProjectGroupedViewProps) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <CategorySection key={group.categoryId ?? 'uncategorized'} group={group} />
      ))}
    </div>
  )
}
