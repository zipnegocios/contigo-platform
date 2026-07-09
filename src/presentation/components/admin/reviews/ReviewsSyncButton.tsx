'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'

export function ReviewsSyncButton() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/reviews/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      const { newCount, updatedCount, deletedCount } = data.result
      toast.success(`Synced: ${newCount} new, ${updatedCount} updated, ${deletedCount} removed`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
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
