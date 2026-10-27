'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'

interface SyncResult {
  newCount: number
  updatedCount: number
  deletedCount: number
}

// Keyed by the `error` code returned by POST /api/admin/reviews/sync.
const SYNC_ERROR_MESSAGES: Record<string, string> = {
  auth_error: 'Google Business Profile access expired or was revoked. Reconnect the Google account, then sync again.',
  pending_api_approval: 'Waiting for Google to approve Business Profile API access. Sync will work once approval is granted.',
  disconnected: 'Google Business Profile is not configured yet. Check the connection in Reviews → Settings.',
  rate_limited: 'Google rate limit reached. Please try again in a few minutes.',
}

function syncErrorMessage(data: { error?: unknown; message?: unknown } | null, status: number): string {
  const code = typeof data?.error === 'string' ? data.error : undefined
  if (code && SYNC_ERROR_MESSAGES[code]) return SYNC_ERROR_MESSAGES[code]
  if (typeof data?.message === 'string') return data.message
  if (status === 401 || status === 403) return 'You do not have permission to sync reviews.'
  return 'Sync failed. Please try again later.'
}

export function ReviewsSyncButton() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/reviews/sync', { method: 'POST' })
      // The body may be empty or non-JSON (proxy errors, timeouts).
      const data = await res.json().catch(() => null)
      const result: SyncResult | undefined = data?.result
      if (!res.ok || !result) {
        toast.error(syncErrorMessage(data, res.status))
        return
      }
      const { newCount, updatedCount, deletedCount } = result
      toast.success(`Synced: ${newCount} new, ${updatedCount} updated, ${deletedCount} removed`)
      router.refresh()
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={syncing} className="gap-2">
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing…' : 'Sync Reviews'}
    </Button>
  )
}
