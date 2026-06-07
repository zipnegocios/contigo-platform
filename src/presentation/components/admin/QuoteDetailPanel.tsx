'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { QuoteStatus } from '@/core/entities/Quote'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'

interface QuoteDetailPanelProps {
  quote: QuoteDTO
  initialNotes?: string
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-lg overflow-hidden"
      style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
    >
      <div
        className="px-6 py-4"
        style={{ borderBottom: '1px solid #F0E8DC', backgroundColor: '#FAF6F0' }}
      >
        <h3
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}
        >
          {title}
        </h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#A89E8C' }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: '#2D2924' }}>
        {value}
      </p>
    </div>
  )
}

export function QuoteDetailPanel({ quote, initialNotes }: QuoteDetailPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState<QuoteStatus>(quote.status)
  const [notes, setNotes] = useState(initialNotes || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update quote')
      }

      toast.success('Quote updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quote')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Details */}
      <div className="md:col-span-2 space-y-6">
        <SectionCard title="Contact Information">
          <InfoField label="Name" value={<span className="text-base font-medium">{quote.name}</span>} />
          <InfoField label="Email" value={quote.email.toString()} />
          {quote.phone && <InfoField label="Phone" value={quote.phone.toString()} />}
        </SectionCard>

        <SectionCard title="Quote Details">
          <InfoField label="Service Requested" value={<span className="text-base font-medium">{quote.service}</span>} />
          <InfoField
            label="Message"
            value={
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6B6560' }}>
                {quote.message}
              </p>
            }
          />
          <InfoField
            label="Tracking Token"
            value={
              <code className="text-xs font-mono break-all" style={{ color: '#A89E8C' }}>
                {quote.trackingToken}
              </code>
            }
          />
          <InfoField label="Submitted" value={quote.createdAt.toLocaleString()} />
        </SectionCard>

        {quote.attachmentUrls.length > 0 && (
          <SectionCard title="Attachments">
            <div className="space-y-2">
              {quote.attachmentUrls.map((key, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded px-3 py-2 text-xs font-mono"
                  style={{ backgroundColor: '#FAF6F0', border: '1px solid #E5DDD0', color: '#6B6560', wordBreak: 'break-all' }}
                >
                  {key}
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: '#A89E8C' }}>
              These are stored in the private <code className="font-mono">contigo-quotes</code> bucket.
              Presigned view URLs will be added in a future update.
            </p>
          </SectionCard>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div
          className="bg-white rounded-lg overflow-hidden"
          style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid #F0E8DC', backgroundColor: '#FAF6F0' }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}
            >
              Manage
            </h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label
                className="text-xs font-medium uppercase tracking-wider mb-2 block"
                style={{ color: '#A89E8C' }}
              >
                Status
              </label>
              <Select value={status} onValueChange={(value) => setStatus(value as QuoteStatus)}>
                <SelectTrigger style={{ borderColor: '#E5DDD0' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                className="text-xs font-medium uppercase tracking-wider mb-2 block"
                style={{ color: '#A89E8C' }}
              >
                Admin Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private notes about this quote…"
                className="min-h-32 text-sm resize-none"
                style={{ borderColor: '#E5DDD0' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#E2C063'
                  e.target.style.boxShadow = '0 0 0 3px rgba(226,192,99,0.12)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5DDD0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200"
              style={{
                backgroundColor: loading ? '#C8A55C' : '#E2C063',
                color: '#1E1A16',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#D4AF37' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#E2C063' }}
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
