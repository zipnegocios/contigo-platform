'use client'

import { useCallback, useEffect, useState } from 'react'

interface SecurityEventRow {
  id: string
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
}

const EVENT_TYPE_OPTIONS = [
  'login_success',
  'login_failed',
  'account_locked',
  'password_reset_requested',
  'password_reset_completed',
  'invitation_sent',
  'invitation_accepted',
  'user_deactivated',
  'user_reactivated',
  'permissions_changed',
]

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [eventType, setEventType] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (cursor?: string | null, filter?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      if (filter) params.set('eventType', filter)
      const res = await fetch(`/api/admin/security-events?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) return
      setEvents((prev) => (cursor ? [...prev, ...data.events] : data.events))
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(null, eventType || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType])

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Security Events
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Read-only audit log of authentication and account changes.
        </p>
      </div>

      <div>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="px-3 py-2 rounded-lg text-fluid-sm outline-none"
          style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
        >
          <option value="">All event types</option>
          {EVENT_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
        <table className="w-full text-fluid-sm">
          <thead>
            <tr style={{ backgroundColor: 'rgba(226, 192, 99, 0.06)', borderBottom: '1px solid rgba(226, 192, 99, 0.12)' }}>
              <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Date</th>
              <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Type</th>
              <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Actor</th>
              <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>IP</th>
              <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>User Agent</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => {
              const ip = (event.payload?.ipAddress as string) ?? '—'
              const ua = (event.payload?.userAgent as string) ?? '—'
              return (
                <tr
                  key={event.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    borderBottom: '1px solid rgba(226, 192, 99, 0.08)',
                  }}
                >
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>
                    {event.eventType}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>
                    {event.actorName ? `${event.actorName} <${event.actorEmail}>` : '—'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>{ip}</td>
                  <td className="px-5 py-3 max-w-xs truncate" style={{ color: 'var(--neutral-600)' }} title={ua}>
                    {ua}
                  </td>
                </tr>
              )
            })}
            {events.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                  No security events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => load(nextCursor, eventType || undefined)}
            className="px-5 py-2 text-fluid-sm font-semibold rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
