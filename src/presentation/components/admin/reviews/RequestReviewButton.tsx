'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'

export function RequestReviewButton({ leadId }: { leadId: string }) {
  const [sending, setSending] = useState(false)

  async function handleClick() {
    setSending(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/request-review`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not schedule a review request')
      toast.success('Review request scheduled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not schedule a review request')
    } finally {
      setSending(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={sending} className="gap-2">
      <Star className="w-4 h-4" />
      {sending ? 'Scheduling…' : 'Request review'}
    </Button>
  )
}
