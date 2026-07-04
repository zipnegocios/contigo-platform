'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

const POLL_INTERVAL_MS = 60_000

export function AdminMessagesBell() {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadUnread = () => {
      fetch('/api/admin/messages/unread')
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) setTotal(json.total ?? 0)
        })
        .catch(() => {
          // Silent — the bell just won't update this cycle.
        })
    }

    loadUnread()
    const interval = setInterval(loadUnread, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <Link
      href="/admin/leads"
      className="relative flex items-center justify-center p-2 rounded-lg transition-colors flex-shrink-0"
      style={{ color: 'var(--neutral-50)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--gold-a12)'
        e.currentTarget.style.color = 'var(--gold-400)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = 'var(--neutral-50)'
      }}
      title={total > 0 ? `${total} unread message${total === 1 ? '' : 's'}` : 'Messages'}
    >
      <Bell className="w-[clamp(1.125rem,2vw,1.375rem)] h-[clamp(1.125rem,2vw,1.375rem)]" />
      {total > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold px-1"
          style={{
            minWidth: '16px',
            height: '16px',
            backgroundColor: '#E2C063',
            color: 'var(--petrol-800)',
          }}
        >
          {total > 99 ? '99+' : total}
        </span>
      )}
    </Link>
  )
}
