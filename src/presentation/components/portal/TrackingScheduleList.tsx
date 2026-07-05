'use client'

import { useState } from 'react'
import { Phone, MapPin, CalendarClock, type LucideIcon } from 'lucide-react'
import { LeadEventType } from '@/core/entities/LeadEvent'
import { useSSE } from '@/presentation/hooks/useSSE'

interface EventItem {
  id: string
  type: LeadEventType
  scheduledAt: Date
  durationMinutes: number
  location: string | null
  meetingDetails: { channel: string; link: string | null } | null
  siteVisitDetails: { address: string | null; mapsLink: string | null; referencePoint: string | null } | null
}

// The schedule/stream SSE payload includes an extra `updatedAt` field used
// internally for server-side diffing — it isn't part of the component's own
// EventItem shape and is dropped on receipt.
type SSEEventItem = EventItem & { updatedAt: string }

interface TrackingScheduleListProps {
  token: string
  events: EventItem[]
}

const EVENT_TYPE_LABELS: Record<LeadEventType, string> = {
  call: 'Call',
  site_visit: 'Site Visit',
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

const EVENT_TYPE_ICONS: Record<LeadEventType, LucideIcon> = {
  call: Phone,
  site_visit: MapPin,
  meeting: CalendarClock,
  follow_up: CalendarClock,
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-AU', {
    timeZone: 'Australia/Adelaide',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EventRow({ event }: { event: EventItem }) {
  const Icon = EVENT_TYPE_ICONS[event.type]

  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: 'var(--petrol-100)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="flex items-center gap-2 text-fluid-sm font-medium" style={{ color: 'var(--petrol-900)' }}>
          <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--petrol-600)', opacity: 0.7 }} />
          {EVENT_TYPE_LABELS[event.type]}
        </p>
        <p className="text-fluid-xs" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
          {formatDateTime(event.scheduledAt)}
        </p>
      </div>
      <p className="text-fluid-xs mt-1" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
        {event.durationMinutes} min{event.location ? ` · ${event.location}` : ''}
      </p>
      {event.meetingDetails && (
        <p className="text-fluid-xs mt-1" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
          Join via {CHANNEL_LABELS[event.meetingDetails.channel as keyof typeof CHANNEL_LABELS] ?? event.meetingDetails.channel}
          {event.meetingDetails.link && (
            <>
              {' · '}
              <a
                href={event.meetingDetails.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--petrol-900)' }}
              >
                Join meeting
              </a>
            </>
          )}
        </p>
      )}
      {event.siteVisitDetails && (
        <div className="text-fluid-xs mt-1" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
          {event.siteVisitDetails.address && <p>{event.siteVisitDetails.address}</p>}
          {event.siteVisitDetails.mapsLink && (
            <p>
              <a
                href={event.siteVisitDetails.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--petrol-900)' }}
              >
                View on Maps
              </a>
            </p>
          )}
          {event.siteVisitDetails.referencePoint && <p>Reference: {event.siteVisitDetails.referencePoint}</p>}
        </div>
      )}
    </div>
  )
}

export function TrackingScheduleList({ token, events: initialEvents }: TrackingScheduleListProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents)

  useSSE<SSEEventItem[]>(`/api/quote-status/${token}/schedule/stream`, (data) => {
    setEvents(data.map(({ updatedAt, ...rest }) => rest))
  })

  const now = Date.now()
  const upcoming = events
    .filter((e) => new Date(e.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  const past = events
    .filter((e) => new Date(e.scheduledAt).getTime() < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  if (events.length === 0) {
    return (
      <div className="rounded-lg shadow-lg p-8 mb-12" style={{ background: 'white' }}>
        <h3 className="flex items-center gap-2 text-fluid-lg font-bold mb-2" style={{ color: 'var(--petrol-900)' }}>
          <CalendarClock className="h-5 w-5" />
          Schedule
        </h3>
        <p className="text-fluid-sm" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
          Nothing scheduled yet — we&apos;ll let you know as soon as a call or visit is arranged.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg shadow-lg p-8 mb-12" style={{ background: 'white' }}>
      <h3 className="flex items-center gap-2 text-fluid-lg font-bold mb-6" style={{ color: 'var(--petrol-900)' }}>
        <CalendarClock className="h-5 w-5" />
        Schedule
      </h3>

      <div className="mb-6">
        <h4 className="text-fluid-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--petrol-600)' }}>
          Upcoming
        </h4>
        {upcoming.length > 0 ? (
          upcoming.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <p className="text-fluid-sm" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
            Nothing on the calendar right now.
          </p>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h4 className="text-fluid-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--petrol-600)' }}>
            Past
          </h4>
          {past.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
