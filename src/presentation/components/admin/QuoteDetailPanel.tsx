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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/presentation/components/ui/accordion'
import { QuoteStatus } from '@/core/entities/Quote'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'

interface QuoteDetailPanelProps {
  quote: QuoteDTO
  initialNotes?: string
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-fluid-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--neutral-600)' }}>
        {label}
      </p>
      <p className="text-fluid-sm" style={{ color: 'var(--neutral-800)' }}>
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

  const defaultOpen = quote.attachmentUrls.length > 0
    ? ['contact', 'quote-details', 'attachments', 'manage']
    : ['contact', 'quote-details', 'manage']

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-6">
      <AccordionItem
        value="contact"
        className="bg-white rounded-lg overflow-hidden border-b-0"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
      >
        <AccordionTrigger
          className="px-6 py-4 hover:no-underline rounded-none"
          style={{ borderBottom: '1px solid #F0E8DC', backgroundColor: 'var(--neutral-50)' }}
        >
          <h3
            className="text-fluid-lg font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
          >
            Contact Information
          </h3>
        </AccordionTrigger>
        <AccordionContent className="px-6 py-5 space-y-4">
          <InfoField label="Name" value={<span className="text-fluid-base font-medium">{quote.name}</span>} />
          <InfoField label="Email" value={quote.email.toString()} />
          {quote.phone && <InfoField label="Phone" value={quote.phone.toString()} />}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="quote-details"
        className="bg-white rounded-lg overflow-hidden border-b-0"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
      >
        <AccordionTrigger
          className="px-6 py-4 hover:no-underline rounded-none"
          style={{ borderBottom: '1px solid #F0E8DC', backgroundColor: 'var(--neutral-50)' }}
        >
          <h3
            className="text-fluid-lg font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
          >
            Quote Details
          </h3>
        </AccordionTrigger>
        <AccordionContent className="px-6 py-5 space-y-4">
          <InfoField label="Service Requested" value={<span className="text-fluid-base font-medium">{quote.service}</span>} />
          <InfoField
            label="Message"
            value={
              <p className="text-fluid-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6B6560' }}>
                {quote.message}
              </p>
            }
          />
          <InfoField
            label="Tracking Token"
            value={
              <code className="text-fluid-xs font-mono break-all" style={{ color: 'var(--neutral-600)' }}>
                {quote.trackingToken}
              </code>
            }
          />
          <InfoField label="Submitted" value={quote.createdAt.toLocaleString()} />
        </AccordionContent>
      </AccordionItem>

      {quote.attachmentUrls.length > 0 && (
        <AccordionItem
          value="attachments"
          className="bg-white rounded-lg overflow-hidden border-b-0"
          style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
        >
          <AccordionTrigger
            className="px-6 py-4 hover:no-underline rounded-none"
            style={{ borderBottom: '1px solid #F0E8DC', backgroundColor: 'var(--neutral-50)' }}
          >
            <h3
              className="text-fluid-lg font-semibold"
              style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
            >
              Attachments
            </h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              {quote.attachmentUrls.map((key, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded px-3 py-2 text-fluid-xs font-mono"
                  style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid #E5DDD0', color: '#6B6560', wordBreak: 'break-all' }}
                >
                  {key}
                </div>
              ))}
            </div>
            <p className="text-fluid-xs mt-3" style={{ color: 'var(--neutral-600)' }}>
              These are stored in the private <code className="font-mono">contigo-quotes</code> bucket.
              Presigned view URLs will be added in a future update.
            </p>
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem
        value="manage"
        className="bg-white rounded-lg overflow-hidden border-b-0"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
      >
        <AccordionTrigger
          className="px-6 py-4 hover:no-underline rounded-none"
          style={{ borderBottom: '1px solid #F0E8DC', backgroundColor: 'var(--neutral-50)' }}
        >
          <h3
            className="text-fluid-lg font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
          >
            Manage
          </h3>
        </AccordionTrigger>
        <AccordionContent className="px-6 py-5 space-y-4">
          <div>
            <label
              className="text-fluid-xs font-medium uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--neutral-600)' }}
            >
              Status
            </label>
            <Select value={status} onValueChange={(value) => setStatus(value as QuoteStatus)}>
              <SelectTrigger style={{ borderColor: 'var(--neutral-200)' }}>
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
              className="text-fluid-xs font-medium uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--neutral-600)' }}
            >
              Admin Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this quote…"
              className="min-h-32 text-fluid-sm resize-none"
              style={{ borderColor: 'var(--neutral-200)' }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--contigo-primary)'
                e.target.style.boxShadow = '0 0 0 3px rgba(226,192,99,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--neutral-200)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-fluid-sm font-semibold tracking-wide transition-all duration-200 min-h-[44px]"
            style={{
              backgroundColor: loading ? '#C8A55C' : 'var(--contigo-primary)',
              color: 'var(--petrol-800)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--gold-600)' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--contigo-primary)' }}
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
