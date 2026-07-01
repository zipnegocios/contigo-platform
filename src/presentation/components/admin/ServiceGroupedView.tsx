'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Trash2, GripVertical, Pencil, Settings2 } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'

export interface ServiceGroupItem {
  id: string
  name: string
  shortDescription: string
  orderIndex: number
  published: boolean
  imageUrl: string
  categoryId: string | null
}

export interface ServiceGroup {
  categoryId: string
  categoryName: string
  categorySlug: string
  services: ServiceGroupItem[]
}

interface ServiceGroupedViewProps {
  groups: ServiceGroup[]
}

function CategorySection({ group }: { group: ServiceGroup }) {
  const router = useRouter()
  const [items, setItems] = useState(group.services)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const initialOrder = group.services.map((s) => s.id)
  const hasChanges = items.some((s, i) => s.id !== initialOrder[i])

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

    const from = items.findIndex((s) => s.id === draggedId)
    const to = items.findIndex((s) => s.id === targetId)
    const next = [...items]
    next.splice(to, 0, next.splice(from, 1)[0])
    next.forEach((s, i) => { s.orderIndex = i })
    setItems(next)
    setDraggedId(null)
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: items.map((s) => ({ id: s.id, orderIndex: s.orderIndex })) }),
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
    if (!confirm('Delete this service?')) return
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems((prev) => prev.filter((s) => s.id !== id))
      toast.success('Service deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-3">
      {/* Category header */}
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
          href={`/admin/services/new?categoryId=${group.categoryId}`}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1 transition-all duration-150"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          + Add service
        </Link>
      </div>

      {/* Service rows */}
      <div
        className="rounded-lg overflow-hidden bg-white"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 1px 4px rgba(45,41,36,0.05)' }}
      >
        {items.length === 0 ? (
          <div className="py-10 text-center text-fluid-sm" style={{ color: '#9C8F83' }}>
            No services in this category yet.
          </div>
        ) : (
          <ul>
            {items.map((svc, idx) => (
              <li
                key={svc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, svc.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, svc.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-move"
                style={{
                  borderBottom: idx < items.length - 1 ? '1px solid #F5EFE8' : 'none',
                  opacity: draggedId === svc.id ? 0.4 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: '#C5BDB5' }} />

                {/* Thumbnail */}
                {svc.imageUrl ? (
                  <img
                    src={svc.imageUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    style={{ border: '1px solid #E5DDD0' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#E2C063', fontSize: '1rem', fontWeight: 700 }}
                  >
                    {svc.name.charAt(0)}
                  </div>
                )}

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-fluid-sm font-medium truncate" style={{ color: '#2D2924' }}>{svc.name}</p>
                  <p className="text-fluid-xs truncate" style={{ color: '#9C8F83' }}>{svc.shortDescription}</p>
                </div>

                {/* Status badge */}
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide flex-shrink-0"
                  style={
                    svc.published
                      ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' }
                      : { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }
                  }
                >
                  {svc.published ? 'Active' : 'Draft'}
                </span>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                  >
                    <Link href={`/admin/services/${svc.id}/edit`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                  >
                    <Link href={`/admin/services/${svc.id}/builder`}>
                      <Settings2 className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                    onClick={() => handleDelete(svc.id)}
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

export function ServiceGroupedView({ groups }: ServiceGroupedViewProps) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <CategorySection key={group.categoryId} group={group} />
      ))}
    </div>
  )
}
