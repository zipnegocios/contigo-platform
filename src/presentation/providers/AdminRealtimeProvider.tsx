'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSSE } from '@/presentation/hooks/useSSE'
import { useNotificationSound } from '@/presentation/hooks/useNotificationSound'

export interface AdminMessagesSnapshot {
  total: number
  byLead: Record<string, number>
  /**
   * Whether the shared SSE stream has ever delivered at least one live
   * snapshot for this mount. `EventSource` auto-reconnects on transient
   * drops, so this is a one-way flip: false -> true on the first real
   * `onMessage`, and it never goes back to false afterwards.
   */
  connected: boolean
}

const DEFAULT_SNAPSHOT: AdminMessagesSnapshot = { total: 0, byLead: {}, connected: false }

const AdminRealtimeContext = createContext<AdminMessagesSnapshot>(DEFAULT_SNAPSHOT)

/**
 * Wraps the admin panel in a SINGLE shared SSE connection to
 * `/api/admin/messages/stream` (admin-wide unread-message summary).
 *
 * Mount this once, high up in the admin layout — `AdminMessagesBell`,
 * `LeadsKanban`, and `LeadsTable` all read the latest snapshot via
 * `useAdminRealtimeMessages()` instead of each opening their own
 * `EventSource`, so there is exactly one connection per admin page load.
 */
export function AdminRealtimeProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AdminMessagesSnapshot>(DEFAULT_SNAPSHOT)
  const { arm, play } = useNotificationSound('/assets/sounds/message-admin.mp3')
  const snapshotRef = useRef<AdminMessagesSnapshot>(DEFAULT_SNAPSHOT)

  // Keep a ref in sync with the latest snapshot so the SSE `onMessage`
  // callback below can compare against "what we knew before this tick"
  // without capturing a stale closure value.
  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  // Arm the notification sound on the first click anywhere in the admin
  // panel (browsers require a genuine gesture to unlock audio playback).
  useEffect(() => {
    document.addEventListener('click', arm, { once: true })
    return () => {
      document.removeEventListener('click', arm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useSSE<Omit<AdminMessagesSnapshot, 'connected'>>('/api/admin/messages/stream', (data) => {
    const previous = snapshotRef.current
    // Only play once we already had a prior live snapshot — the very first
    // snapshot after mount can jump from the default `total: 0` to some
    // existing nonzero total that reflects pre-existing unread messages,
    // not a newly-arrived one.
    if (previous.connected && data.total > previous.total) {
      play()
    }
    setSnapshot({ ...data, connected: true })
  })

  return <AdminRealtimeContext.Provider value={snapshot}>{children}</AdminRealtimeContext.Provider>
}

/**
 * Reads the latest admin-wide unread-message snapshot pushed over SSE.
 * Degrades gracefully (returns the zero-value default) when used outside
 * an `AdminRealtimeProvider`, so consumers don't need to guard against it.
 */
export function useAdminRealtimeMessages(): AdminMessagesSnapshot {
  return useContext(AdminRealtimeContext)
}
