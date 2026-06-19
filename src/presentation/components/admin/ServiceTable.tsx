'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { Trash2, GripVertical, Pencil } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'

interface Service {
  id: string
  name: string
  shortDescription: string
  orderIndex: number
  published: boolean
  imageUrl: string
}

interface ServiceTableProps {
  services: Service[]
}

export function ServiceTable({ services: initialServices }: ServiceTableProps) {
  const router = useRouter()
  const [services, setServices] = useState(initialServices)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

    const draggedIndex = services.findIndex((s) => s.id === draggedId)
    const targetIndex = services.findIndex((s) => s.id === targetId)

    const newServices = [...services]
    ;[newServices[draggedIndex], newServices[targetIndex]] = [
      newServices[targetIndex],
      newServices[draggedIndex],
    ]
    newServices.forEach((service, index) => { service.orderIndex = index })

    setServices(newServices)
    setDraggedId(null)
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: services.map((s) => ({ id: s.id, orderIndex: s.orderIndex })),
        }),
      })

      if (!response.ok) throw new Error('Failed to save order')

      toast.success('Service order updated')
      router.refresh()
    } catch (error) {
      toast.error('Failed to save order')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return

    try {
      const response = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Service deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete')
      console.error(error)
    }
  }

  const hasChanges = services.some((s, i) => s.orderIndex !== initialServices[i]?.orderIndex)

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg overflow-hidden bg-white"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid #E5DDD0' }}>
              <TableHead className="w-8 py-3"></TableHead>
              <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Name</TableHead>
              <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Description</TableHead>
              <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Status</TableHead>
              <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                  No services yet
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow
                  key={service.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, service.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, service.id)}
                  className="cursor-move"
                  style={{
                    borderBottom: '1px solid #F0E8DC',
                    opacity: draggedId === service.id ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-50)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <TableCell className="py-3.5">
                    <GripVertical className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" style={{ color: '#C5BDB5' }} />
                  </TableCell>
                  <TableCell className="font-medium py-3.5 text-fluid-sm" style={{ color: 'var(--neutral-800)' }}>
                    {service.name}
                  </TableCell>
                  <TableCell className="text-fluid-sm py-3.5" style={{ color: '#6B6560' }}>
                    {service.shortDescription}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide"
                      style={
                        service.published
                          ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' }
                          : { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }
                      }
                    >
                      {service.published ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] p-0 transition-all duration-150"
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
                        <Link href={`/admin/services/${service.id}/edit`}>
                          <Pencil className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] p-0 transition-all duration-150"
                        style={{ borderColor: 'var(--neutral-200)', color: '#6B6560' }}
                        onClick={() => handleDelete(service.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#dc2626'
                          e.currentTarget.style.color = '#dc2626'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--neutral-200)'
                          e.currentTarget.style.color = '#6B6560'
                        }}
                      >
                        <Trash2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasChanges && (
        <button
          onClick={handleSaveOrder}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-fluid-sm font-semibold transition-all duration-200 min-h-[44px]"
          style={{
            backgroundColor: saving ? '#C8A55C' : 'var(--contigo-primary)',
            color: 'var(--petrol-800)',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = 'var(--gold-600)' }}
          onMouseLeave={(e) => { if (!saving) e.currentTarget.style.backgroundColor = 'var(--contigo-primary)' }}
        >
          {saving ? 'Saving…' : 'Save Order'}
        </button>
      )}
    </div>
  )
}
