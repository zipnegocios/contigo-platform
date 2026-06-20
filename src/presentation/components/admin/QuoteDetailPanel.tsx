'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { LeadStage } from '@/core/entities/Lead'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'
import type { LeadNoteDTO } from '@/presentation/types/LeadNoteDTO'
import type { LeadContactDTO } from '@/presentation/types/LeadContactDTO'
import { LeadNotesPanel } from './LeadNotesPanel'
import { LeadContactsPanel } from './LeadContactsPanel'
import { QuoteAttachmentsGrid } from './QuoteAttachmentsGrid'

interface QuoteDetailPanelProps {
  leadId: string
  quote: QuoteDTO
  initialStage: LeadStage
  notes: LeadNoteDTO[]
  contacts: LeadContactDTO[]
  onContactsChange: Dispatch<SetStateAction<LeadContactDTO[]>>
  onStageChange?: (newStage: string) => void
  onMutated?: () => void
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

export function QuoteDetailPanel({ leadId, quote, initialStage, notes, contacts, onContactsChange, onStageChange, onMutated }: QuoteDetailPanelProps) {
  const router = useRouter()
  const [stage, setStage] = useState<LeadStage>(initialStage)
  const [stageSaving, setStageSaving] = useState(false)

  const handleStageSelect = async (newStage: LeadStage) => {
    setStageSaving(true)
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update stage')
      }

      setStage(newStage)
      toast.success('Stage updated')
      onStageChange?.(newStage)
      router.refresh()
      onMutated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stage')
      console.error(error)
    } finally {
      setStageSaving(false)
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
          <LeadContactsPanel leadId={leadId} contacts={contacts} onContactsChange={onContactsChange} />
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
          <InfoField
            label="Quote Status"
            value={
              <span className="inline-block px-2 py-0.5 rounded text-fluid-xs uppercase tracking-wide" style={{ backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }}>
                {quote.status.replace('_', ' ')}
              </span>
            }
          />
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
            <QuoteAttachmentsGrid leadId={leadId} fileKeys={quote.attachmentUrls} />
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
              Stage
            </label>
            <Select value={stage} onValueChange={(value) => handleStageSelect(value as LeadStage)} disabled={stageSaving}>
              <SelectTrigger style={{ borderColor: 'var(--neutral-200)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <LeadNotesPanel leadId={leadId} notes={notes} onMutated={onMutated} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
