'use client'

import { useState } from 'react'
import { FileText, Receipt, Paperclip } from 'lucide-react'
import { LeadDocumentCategory } from '@/core/entities/LeadDocument'

interface DocumentItem {
  id: string
  fileName: string
  category: LeadDocumentCategory
  createdAt: Date
}

interface TrackingDocumentsListProps {
  token: string
  documents: DocumentItem[]
  attachmentUrls: string[]
}

const CATEGORY_GROUP: Record<LeadDocumentCategory, 'quotes' | 'invoices' | 'other'> = {
  quote_pdf: 'quotes',
  invoice: 'invoices',
  reference_photo: 'other',
  site_photo: 'other',
  contract: 'other',
  other: 'other',
}

function deriveDisplayName(key: string): string {
  const lastSegment = key.split('/').pop() ?? key
  try {
    return decodeURIComponent(lastSegment)
  } catch {
    return lastSegment
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function DocumentRow({
  label,
  dateLabel,
  onOpen,
}: {
  label: string
  dateLabel?: string
  onOpen: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    setError(false)
    try {
      await onOpen()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--atelier-border)' }}>
      <div className="min-w-0">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="text-fluid-sm font-medium underline underline-offset-2 break-all text-left disabled:opacity-50"
          style={{ color: 'var(--heritage-charcoal)' }}
        >
          {loading ? 'Opening…' : label}
        </button>
        {dateLabel && (
          <p className="text-fluid-xs mt-1" style={{ color: 'var(--atelier-ink)', opacity: 0.7 }}>
            {dateLabel}
          </p>
        )}
        {error && (
          <p className="text-fluid-xs mt-1" style={{ color: '#B3261E' }}>
            Could not open this file. Please try again.
          </p>
        )}
      </div>
    </div>
  )
}

async function openPresignedUrl(fetchUrl: string) {
  const res = await fetch(fetchUrl)
  if (!res.ok) throw new Error('Failed to fetch download URL')
  const data = await res.json()
  if (!data?.url) throw new Error('Missing url in response')
  window.open(data.url, '_blank')
}

export function TrackingDocumentsList({ token, documents, attachmentUrls }: TrackingDocumentsListProps) {
  const quotes = documents.filter((d) => CATEGORY_GROUP[d.category] === 'quotes')
  const invoices = documents.filter((d) => CATEGORY_GROUP[d.category] === 'invoices')
  const other = documents.filter((d) => CATEGORY_GROUP[d.category] === 'other')

  const hasAnyDocuments = documents.length > 0
  const hasAttachments = attachmentUrls.length > 0

  if (!hasAnyDocuments && !hasAttachments) {
    return (
      <div className="rounded-lg shadow-lg p-8 mb-12" style={{ background: 'white' }}>
        <h3 className="flex items-center gap-2 text-fluid-lg font-bold mb-2" style={{ color: 'var(--heritage-charcoal)' }}>
          <FileText className="w-5 h-5" />
          Documents
        </h3>
        <p className="text-fluid-sm" style={{ color: 'var(--atelier-ink)', opacity: 0.7 }}>
          No documents yet — we&apos;ll notify you by email when your quote is ready.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg shadow-lg p-8 mb-12" style={{ background: 'white' }}>
      <h3 className="flex items-center gap-2 text-fluid-lg font-bold mb-6" style={{ color: 'var(--heritage-charcoal)' }}>
        <FileText className="w-5 h-5" />
        Documents
      </h3>

      {quotes.length > 0 && (
        <div className="mb-6">
          <h4 className="flex items-center gap-1.5 text-fluid-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--atelier-ink)' }}>
            <FileText className="w-4 h-4" />
            Quotes
          </h4>
          {quotes.map((doc) => (
            <DocumentRow
              key={doc.id}
              label={doc.fileName}
              dateLabel={formatDate(doc.createdAt)}
              onOpen={() => openPresignedUrl(`/api/quote-status/${token}/documents/${doc.id}`)}
            />
          ))}
        </div>
      )}

      {invoices.length > 0 && (
        <div className="mb-6">
          <h4 className="flex items-center gap-1.5 text-fluid-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--atelier-ink)' }}>
            <Receipt className="w-4 h-4" />
            Invoices
          </h4>
          {invoices.map((doc) => (
            <DocumentRow
              key={doc.id}
              label={doc.fileName}
              dateLabel={formatDate(doc.createdAt)}
              onOpen={() => openPresignedUrl(`/api/quote-status/${token}/documents/${doc.id}`)}
            />
          ))}
        </div>
      )}

      {other.length > 0 && (
        <div className="mb-6">
          <h4 className="flex items-center gap-1.5 text-fluid-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--atelier-ink)' }}>
            <Paperclip className="w-4 h-4" />
            Other
          </h4>
          {other.map((doc) => (
            <DocumentRow
              key={doc.id}
              label={doc.fileName}
              dateLabel={formatDate(doc.createdAt)}
              onOpen={() => openPresignedUrl(`/api/quote-status/${token}/documents/${doc.id}`)}
            />
          ))}
        </div>
      )}

      {hasAttachments && (
        <div>
          <h4 className="text-fluid-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--atelier-ink)' }}>
            Your attachments
          </h4>
          {attachmentUrls.map((key) => (
            <DocumentRow
              key={key}
              label={deriveDisplayName(key)}
              onOpen={() => openPresignedUrl(`/api/quote-status/${token}/attachments?key=${encodeURIComponent(key)}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
