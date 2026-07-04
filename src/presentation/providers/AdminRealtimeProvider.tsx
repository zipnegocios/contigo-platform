'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useSSE } from '@/presentation/hooks/useSSE'

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

  useSSE<Omit<AdminMessagesSnapshot, 'connected'>>('/api/admin/messages/stream', (data) => {
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
