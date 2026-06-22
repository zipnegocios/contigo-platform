'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { LeadEventForm } from './LeadEventForm'
import type { LeadEventDTO } from '@/presentation/types/LeadEventDTO'
import type { LeadEventType } from '@/core/entities/LeadEvent'
import type { LeadContactDTO } from '@/presentation/types/LeadContactDTO'

interface LeadEventsPanelProps {
  leadId: string
  events: LeadEventDTO[]
  contacts: LeadContactDTO[]
  onContactsChange: Dispatch<SetStateAction<LeadContactDTO[]>>
  onMutated?: () => void
}

const TYPE_LABELS: Record<LeadEventType, string> = {
  call: 'Call',
  site_visit: 'Site visit',
  meeting: 'Meeting',
  follow_up: 'Follow-up',
}

const CHANNEL_LABELS: Record<'google_meet' | 'zoom' | 'teams' | 'whatsapp' | 'other', string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  whatsapp: 'WhatsApp video call',
  other: 'Other',
}

export function LeadEventsPanel({ leadId, events, contacts, onContactsChange, onMutated }: LeadEventsPanelProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LeadEventDTO | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const afterMutation = () => {
    router.refresh()
    onMutated?.()
  }

  const updateStatus = async (eventId: string, status: 'completed' | 'cancelled') => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update event')
      toast.success('Updated')
      afterMutation()
    } catch {
      toast.error('Could not update event')
    }
  }

  const archiveEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/events/${eventId}/archive`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to delete event')
      toast.success('Event deleted')
      afterMutation()
    } catch {
      toast.error('Could not delete event')
    }
  }

  const restoreEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/events/${eventId}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore event')
      toast.success('Event restored')
      afterMutation()
    } catch {
      toast.error('Could not restore event')
    }
  }

  const contactName = (contactId: string | null): string | null => {
    if (!contactId) return null
    return contacts.find((c) => c.id === contactId)?.name ?? null
  }

  const summaryLine = (event: LeadEventDTO): string | null => {
    const meta = event.metadata
    if (meta.kind === 'call' || meta.kind === 'follow_up') {
      return contactName(meta.contactId)
    }
    if (meta.kind === 'site_visit') {
      const parts: string[] = []
      const name = contactName(meta.contactId)
      if (name) parts.push(name)
      if (meta.address) parts.push(meta.address)
      return parts.length > 0 ? parts.join(' · ') : null
    }
    const parts: string[] = [CHANNEL_LABELS[meta.channel]]
    if (meta.link) parts.push(meta.link)
    return parts.join(' · ')
  }

  const visibleEvents = events.filter((e) => (showArchived ? e.archivedAt !== null : e.archivedAt === null))
  const hasArchived = events.some((e) => e.archivedAt !== null)

  return (
    <div className="space-y-4">
      {showForm ? (
        <LeadEventForm
          leadId={leadId}
          contacts={contacts}
          onContactsChange={onContactsChange}
          onSaved={() => {
            setShowForm(false)
            afterMutation()
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          Schedule new event
        </Button>
      )}

      <div className="space-y-2">
        {visibleEvents.length === 0 ? (
          <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
            {showArchived ? 'No deleted events.' : 'No events yet.'}
          </p>
        ) : (
          visibleEvents.map((event) =>
            editingEvent?.id === event.id ? (
              <LeadEventForm
                key={event.id}
                leadId={leadId}
                contacts={contacts}
                onContactsChange={onContactsChange}
                initialEvent={editingEvent}
                onSaved={() => {
                  setEditingEvent(null)
                  afterMutation()
                }}
                onCancel={() => setEditingEvent(null)}
              />
            ) : (
              <div key={event.id} className="rounded-lg p-3" style={{ border: '1px solid #E5DDD0' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
                      {TYPE_LABELS[event.type]} — {event.scheduledAt.toLocaleString()}
                    </p>
                    {summaryLine(event) && (
                      <p className="text-fluid-xs break-words" style={{ color: 'var(--neutral-600)' }}>
                        {summaryLine(event)}
                      </p>
                    )}
                    {event.notes && (
                      <p className="text-fluid-xs whitespace-pre-wrap mt-1" style={{ color: 'var(--neutral-600)' }}>
                        {event.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant={event.status === 'completed' ? 'default' : 'secondary'}>{event.status}</Badge>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {event.archivedAt ? (
                    <Button size="sm" variant="outline" onClick={() => restoreEvent(event.id)}>
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditingEvent(event)}>
                        Edit
                      </Button>
                      {event.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(event.id, 'completed')}>
                            Complete
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(event.id, 'cancelled')}>
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => archiveEvent(event.id)}>
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ),
          )
        )}
      </div>

      {hasArchived && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-fluid-xs underline"
          style={{ color: 'var(--neutral-600)' }}
        >
          {showArchived ? 'Hide deleted events' : 'Show deleted events'}
        </button>
      )}
    </div>
  )
}
