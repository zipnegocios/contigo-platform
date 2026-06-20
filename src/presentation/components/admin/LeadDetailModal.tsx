'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { LeadDetailTabs } from './LeadDetailTabs'

interface LeadDetailModalProps {
  onStageChange?: (leadId: string, newStage: string) => void
}

export function LeadDetailModal({ onStageChange }: LeadDetailModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams?.get('leadId') ?? null

  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!leadId) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/admin/leads/${leadId}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled) setData(json) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [leadId])

  const close = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('leadId')
    const query = params.toString()
    router.push(`/admin/leads${query ? `?${query}` : ''}`, { scroll: false })
  }

  useEffect(() => {
    if (!leadId) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  if (!leadId) return null

  // Reconstruct Date fields lost in the JSON round-trip (see task instructions —
  // every date arrives as an ISO string from fetch().json(), not a Date instance).
  const mapped = data
    ? {
        lead: { ...data.lead, updatedAt: new Date(data.lead.updatedAt) },
        quote: {
          ...data.quote,
          createdAt: new Date(data.quote.createdAt),
          updatedAt: new Date(data.quote.updatedAt),
        },
        events: (data.events ?? []).map((e: any) => ({
          ...e,
          scheduledAt: new Date(e.scheduledAt),
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
          archivedAt: e.archivedAt ? new Date(e.archivedAt) : null,
        })),
        documents: (data.documents ?? []).map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          archivedAt: d.archivedAt ? new Date(d.archivedAt) : null,
        })),
        activities: (data.activities ?? []).map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        })),
        notes: (data.notes ?? []).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
          archivedAt: n.archivedAt ? new Date(n.archivedAt) : null,
        })),
        contacts: (data.contacts ?? []).map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          archivedAt: c.archivedAt ? new Date(c.archivedAt) : null,
        })),
      }
    : null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-stretch justify-center"
      style={{ backgroundColor: 'rgba(30,26,22,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="relative w-full overflow-y-auto"
        style={{ backgroundColor: 'var(--neutral-50)' }}
      >
        <button
          type="button"
          onClick={close}
          className="fixed top-4 right-4 z-10 p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ backgroundColor: '#fff', border: '1px solid #E5DDD0' }}
        >
          <X className="h-5 w-5" style={{ color: 'var(--neutral-600)' }} />
        </button>

        {loading || !mapped ? (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--contigo-primary)' }} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-8 py-12 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{mapped.quote.name}</h1>
              <p className="text-muted-foreground">{mapped.quote.service}</p>
            </div>
            <LeadDetailTabs
              lead={mapped.lead}
              quote={mapped.quote}
              events={mapped.events}
              documents={mapped.documents}
              activities={mapped.activities}
              notes={mapped.notes}
              contacts={mapped.contacts}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
