'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import type { ReviewRequestDTO } from '@/presentation/types/ReviewRequestDTO'
import type { ReviewRequestStatus } from '@/core/entities/ReviewRequest'

const STATUS_LABEL: Record<ReviewRequestStatus, string> = {
  scheduled: 'Scheduled',
  sent: 'Sent',
  opened: 'Opened',
  clicked: 'Clicked',
  reviewed_inferred: 'Reviewed (inferred)',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

const STATUS_STYLE: Record<ReviewRequestStatus, { bg: string; color: string }> = {
  scheduled: { bg: 'rgba(107,101,96,0.1)', color: '#6B6560' },
  sent: { bg: 'rgba(226,192,99,0.15)', color: '#A07B2A' },
  opened: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
  clicked: { bg: 'rgba(147,51,234,0.12)', color: '#7c3aed' },
  reviewed_inferred: { bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
  expired: { bg: 'rgba(107,101,96,0.1)', color: '#6B6560' },
  cancelled: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
}

const CANCELLABLE_STATUSES = new Set<ReviewRequestStatus>(['scheduled', 'sent', 'opened', 'clicked'])

export function ReviewRequestsManagerClient({ requests }: { requests: ReviewRequestDTO[] }) {
  const router = useRouter()
  const [items, setItems] = useState(requests)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  async function handleCancel(id: string) {
    setCancellingId(id)
    try {
      const res = await fetch(`/api/admin/reviews/requests/${id}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to cancel request')
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)))
      toast.success('Review request cancelled')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel request')
    } finally {
      setCancellingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-fluid-sm py-8 text-center" style={{ color: 'var(--neutral-600)' }}>
        No review requests yet — they get scheduled automatically when a lead reaches the &quot;won&quot; stage.
      </p>
    )
  }

  return (
    <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
      <table className="w-full text-fluid-sm">
        <thead>
          <tr style={{ backgroundColor: 'rgba(226, 192, 99, 0.06)', borderBottom: '1px solid rgba(226, 192, 99, 0.12)' }}>
            <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Contact</th>
            <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Status</th>
            <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Scheduled for</th>
            <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Reminders</th>
            <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((request, i) => (
            <tr
              key={request.id}
              style={{
                backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                borderBottom: '1px solid rgba(226, 192, 99, 0.08)',
              }}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <p style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>{request.contactName}</p>
                <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>{request.contactEmail}</p>
              </td>
              <td className="px-4 py-3">
                <Badge style={{ backgroundColor: STATUS_STYLE[request.status].bg, color: STATUS_STYLE[request.status].color }}>
                  {STATUS_LABEL[request.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>
                {new Date(request.scheduledFor).toLocaleDateString()}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--neutral-600)' }}>{request.reminderCount}</td>
              <td className="px-4 py-3 text-center">
                {CANCELLABLE_STATUSES.has(request.status) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingId === request.id}
                    onClick={() => handleCancel(request.id)}
                  >
                    Cancel
                  </Button>
                ) : (
                  <span style={{ color: 'var(--neutral-600)' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
