'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

interface TrackingBellProps {
  token: string
  initialCount: number
}

const POLL_INTERVAL_MS = 60000

export function TrackingBell({ token, initialCount }: TrackingBellProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/quote-status/${token}/messages/unread-count`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && typeof data?.count === 'number') {
          setCount(data.count)
        }
      } catch {
        // Silent — keep showing the last known count.
      }
    }

    const intervalId = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [token])

  useEffect(() => {
    const handleRead = () => setCount(0)
    window.addEventListener('tracking-messages-read', handleRead)
    return () => window.removeEventListener('tracking-messages-read', handleRead)
  }, [])

  return (
    <div className="relative inline-flex items-center" aria-label={`${count} unread message${count === 1 ? '' : 's'}`}>
      <Bell size={22} color="#E2C063" strokeWidth={1.75} />
      {count > 0 && (
        <span
          className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-fluid-xs font-semibold"
          style={{
            minWidth: '1.1rem',
            height: '1.1rem',
            padding: '0 0.3rem',
            background: '#E2C063',
            color: '#1E1A16',
            lineHeight: 1,
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  )
}
