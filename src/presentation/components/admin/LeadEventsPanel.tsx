'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import type { LeadEventDTO } from '@/presentation/types/LeadEventDTO'

export function LeadEventsPanel({ leadId, events }: { leadId: string; events: LeadEventDTO[] }) {
  const router = useRouter()
  const [type, setType] = useState<'call' | 'site_visit' | 'meeting'>('call')
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  const schedule = async () => {
    if (!scheduledAt) {
      toast.error('Selecciona fecha y hora')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, scheduledAt, location }),
      })
      if (!res.ok) throw new Error()
      toast.success('Evento agendado')
      setScheduledAt('')
      setLocation('')
      router.refresh()
    } catch {
      toast.error('No se pudo agendar')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (eventId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success('Actualizado')
      router.refresh()
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border p-4">
        <select value={type} onChange={(e) => setType(e.target.value as 'call' | 'site_visit' | 'meeting')} className="rounded border px-3 py-2 text-sm">
          <option value="call">Llamada</option>
          <option value="site_visit">Visita a obra</option>
          <option value="meeting">Reunión</option>
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Dirección / link / teléfono"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded border px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <Button onClick={schedule} disabled={loading}>Agendar</Button>
      </div>

      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {e.type === 'call' ? 'Llamada' : e.type === 'site_visit' ? 'Visita a obra' : 'Reunión'} —{' '}
                {new Date(e.scheduledAt).toLocaleString()}
              </p>
              {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={e.status === 'completed' ? 'default' : 'secondary'}>{e.status}</Badge>
              {e.status === 'scheduled' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(e.id, 'completed')}>Completar</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(e.id, 'cancelled')}>Cancelar</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
