'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { ContactPickerOrCreate } from './ContactPickerOrCreate'
import type { LeadEventDTO } from '@/presentation/types/LeadEventDTO'
import type { LeadEventMetadata, LeadEventType } from '@/core/entities/LeadEvent'
import type { LeadContactDTO } from '@/presentation/types/LeadContactDTO'

interface LeadEventFormProps {
  leadId: string
  contacts: LeadContactDTO[]
  onContactsChange: Dispatch<SetStateAction<LeadContactDTO[]>>
  initialEvent?: LeadEventDTO
  onSaved: () => void
  onCancel: () => void
}

const CHANNEL_OPTIONS: Array<{ value: 'google_meet' | 'zoom' | 'teams' | 'whatsapp' | 'other'; label: string }> = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'whatsapp', label: 'WhatsApp video call' },
  { value: 'other', label: 'Other' },
]

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function LeadEventForm({ leadId, contacts, onContactsChange, initialEvent, onSaved, onCancel }: LeadEventFormProps) {
  const isEdit = !!initialEvent
  const [type, setType] = useState<LeadEventType>(initialEvent?.type ?? 'call')
  const [scheduledAt, setScheduledAt] = useState(initialEvent ? toDatetimeLocalValue(initialEvent.scheduledAt) : '')
  const [durationMinutes, setDurationMinutes] = useState(initialEvent?.durationMinutes ?? 30)
  const [notes, setNotes] = useState(initialEvent?.notes ?? '')
  const [saving, setSaving] = useState(false)

  // Type-specific fields, seeded from initialEvent.metadata when editing and the kind matches
  const initialMeta = initialEvent?.metadata
  const [contactId, setContactId] = useState<string | null>(
    initialMeta && initialMeta.kind !== 'meeting' ? initialMeta.contactId : null,
  )
  const [mapsLink, setMapsLink] = useState(initialMeta?.kind === 'site_visit' ? initialMeta.mapsLink ?? '' : '')
  const [address, setAddress] = useState(initialMeta?.kind === 'site_visit' ? initialMeta.address ?? '' : '')
  const [referencePoint, setReferencePoint] = useState(initialMeta?.kind === 'site_visit' ? initialMeta.referencePoint ?? '' : '')
  const [channel, setChannel] = useState<'google_meet' | 'zoom' | 'teams' | 'whatsapp' | 'other'>(
    initialMeta?.kind === 'meeting' ? initialMeta.channel : 'google_meet',
  )
  const [link, setLink] = useState(initialMeta?.kind === 'meeting' ? initialMeta.link ?? '' : '')

  const buildMetadata = (): LeadEventMetadata => {
    if (type === 'call') return { kind: 'call', contactId }
    if (type === 'site_visit') return { kind: 'site_visit', contactId, mapsLink: mapsLink || null, address: address || null, referencePoint: referencePoint || null }
    return { kind: 'meeting', channel, link: link || null }
  }

  const handleSubmit = async () => {
    if (!scheduledAt) {
      toast.error('Please select a date and time')
      return
    }
    setSaving(true)
    try {
      const metadata = buildMetadata()
      if (isEdit && initialEvent) {
        const res = await fetch(`/api/admin/leads/${leadId}/events/${initialEvent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledAt: new Date(scheduledAt).toISOString(),
            durationMinutes,
            notes: notes || null,
            metadata,
          }),
        })
        if (!res.ok) throw new Error('Failed to update event')
      } else {
        const res = await fetch(`/api/admin/leads/${leadId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            scheduledAt: new Date(scheduledAt).toISOString(),
            durationMinutes,
            notes: notes || undefined,
            metadata,
          }),
        })
        if (!res.ok) throw new Error('Failed to schedule event')
      }
      toast.success(isEdit ? 'Event updated' : 'Event scheduled')
      onSaved()
    } catch {
      toast.error(isEdit ? 'Could not update event' : 'Could not schedule event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg p-4" style={{ border: '1px solid #E5DDD0' }}>
      <div className="flex flex-wrap gap-2">
        <Select value={type} onValueChange={(v) => setType(v as LeadEventType)} disabled={isEdit}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="site_visit">Site visit</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--neutral-200)' }}
        />
        <input
          type="number"
          min={5}
          step={5}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className="rounded border px-3 py-2 text-sm w-24"
          style={{ borderColor: 'var(--neutral-200)' }}
          aria-label="Duration in minutes"
        />
      </div>

      {(type === 'call' || type === 'site_visit') && (
        <div>
          <label className="text-fluid-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--neutral-600)' }}>Contact</label>
          <ContactPickerOrCreate
            leadId={leadId}
            contacts={contacts}
            onContactsChange={onContactsChange}
            value={contactId}
            onChange={setContactId}
          />
        </div>
      )}

      {type === 'site_visit' && (
        <div className="grid gap-2">
          <input type="text" placeholder="Google Maps link" value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} className="rounded border px-3 py-2 text-sm" style={{ borderColor: 'var(--neutral-200)' }} />
          <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded border px-3 py-2 text-sm" style={{ borderColor: 'var(--neutral-200)' }} />
          <input type="text" placeholder="Reference point" value={referencePoint} onChange={(e) => setReferencePoint(e.target.value)} className="rounded border px-3 py-2 text-sm" style={{ borderColor: 'var(--neutral-200)' }} />
        </div>
      )}

      {type === 'meeting' && (
        <div className="grid gap-2">
          <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="text" placeholder="Meeting link" value={link} onChange={(e) => setLink(e.target.value)} className="rounded border px-3 py-2 text-sm" style={{ borderColor: 'var(--neutral-200)' }} />
        </div>
      )}

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes or comments…"
        className="min-h-16 text-fluid-sm resize-none"
        style={{ borderColor: 'var(--neutral-200)' }}
      />

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={saving}>{isEdit ? 'Save changes' : 'Schedule'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
