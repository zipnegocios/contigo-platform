'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Trash2, GripVertical } from 'lucide-react'
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
    ;[newServices[draggedIndex], newServices[targetIndex]] = [newServices[targetIndex], newServices[draggedIndex]]

    // Update order indices
    newServices.forEach((service, index) => {
      service.orderIndex = index
    })

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
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      })

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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                  className={`cursor-move ${draggedId === service.id ? 'opacity-50' : ''}`}
                >
                  <TableCell className="cursor-move">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-sm">{service.shortDescription}</TableCell>
                  <TableCell>
                    <Badge variant={service.published ? 'default' : 'secondary'}>
                      {service.published ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasChanges && (
        <Button onClick={handleSaveOrder} disabled={saving}>
          {saving ? 'Saving...' : 'Save Order'}
        </Button>
      )}
    </div>
  )
}
