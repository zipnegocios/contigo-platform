'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useSSE } from '@/presentation/hooks/useSSE'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'

interface NotificationItem {
  id: string
  type: string
  label: string
  createdAt: string
}

interface NotificationFeed {
  items: NotificationItem[]
  unreadCount: number
}

interface TrackingNotificationBellProps {
  token: string
}

const EMPTY_FEED: NotificationFeed = { items: [], unreadCount: 0 }

/**
 * Replaces the "Request a Quote" CTA in the header when the current route is
 * a client tracking page (`/quote-status/[token]`) — a returning client
 * already has a quote, so the CTA is meaningless there; a notification bell
 * for their lead's activity feed is useful instead.
 *
 * Unlike the portal's own components (`TrackingStatusCard`, etc.), this bell
 * has no SSR-provided initial state to reconcile — the header is rendered
 * globally, not from the token-scoped page tree — so it fetches its initial
 * `{ items, unreadCount }` on mount, then layers live SSE updates on top.
 *
 * Visually a relocated/broadened version of the retired polling `TrackingBell`
 * (gold `#E2C063` bell + circular badge), now wrapped in a real dropdown
 * instead of just toggling a badge.
 */
export function TrackingNotificationBell({ token }: TrackingNotificationBellProps) {
  const [feed, setFeed] = useState<NotificationFeed>(EMPTY_FEED)

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      try {
        const res = await fetch(`/api/quote-status/${token}/notifications`)
        if (!res.ok) return
        const data = (await res.json()) as NotificationFeed
        if (!cancelled) setFeed(data)
      } catch {
        // Silent — bell just stays at its default/last-known state.
      }
    }

    loadInitial()
    return () => {
      cancelled = true
    }
  }, [token])

  useSSE<NotificationFeed>(`/api/quote-status/${token}/notifications/stream`, (data) => {
    setFeed(data)
  })

  // Fires when the dropdown transitions to open (not on every render — this
  // is the Radix `onOpenChange` callback, invoked only on actual open/close
  // toggles). Marks-viewed server-side and zeroes the badge optimistically;
  // the POST is fire-and-forget so a slow/failed request never blocks the UI.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return
      setFeed((prev) => ({ ...prev, unreadCount: 0 }))
      fetch(`/api/quote-status/${token}/notifications`, { method: 'POST' }).catch(() => {
        // Fire-and-forget — a failed mark-viewed call just risks the badge
        // reappearing on the next SSE push, not a user-facing error.
      })
    },
    [token],
  )

  const { items, unreadCount } = feed

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex items-center justify-center p-2"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}
        >
          <Bell size={22} color="#E2C063" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-semibold"
              style={{
                minWidth: '1.1rem',
                height: '1.1rem',
                padding: '0 0.3rem',
                backgroundColor: '#E2C063',
                color: '#1E1A16',
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {items.length === 0 ? (
          <DropdownMenuLabel>No notifications yet</DropdownMenuLabel>
        ) : (
          items.map((item) => (
            <DropdownMenuItem key={item.id} disabled className="flex-col items-start gap-0.5 cursor-default">
              <span className="text-sm">{item.label}</span>
              <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
