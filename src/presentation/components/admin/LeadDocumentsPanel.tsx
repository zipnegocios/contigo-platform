'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { MediaPickerModal } from './MediaPickerModal'
import { QuoteAttachmentsGrid } from './QuoteAttachmentsGrid'
import type {
  LeadDocumentCategory,
  LeadDocumentDirection,
} from '@/core/entities/LeadDocument'

interface LeadDocumentItem {
  id: string
  fileKey: string
  fileName: string
  mimeType: string | null
  direction: LeadDocumentDirection
  category: LeadDocumentCategory
  createdAt: Date
  archivedAt: Date | null
}

interface LeadDocumentsPanelProps {
  leadId: string
  documents: LeadDocumentItem[]
  clientAttachmentKeys: string[]
  onMutated?: () => void
}

const ASSETS_BASE_URL =
  process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'

const DIRECTION_LABELS: Record<LeadDocumentDirection, string> = {
  client_upload: 'Received from client',
  admin_sent: 'Sent to client',
  internal: 'Internal',
}

const CATEGORY_LABELS: Record<LeadDocumentCategory, string> = {
  reference_photo: 'Reference photo',
  site_photo: 'Site photo',
  quote_pdf: 'Quote PDF',
  contract: 'Contract',
  other: 'Other',
}

export function LeadDocumentsPanel({
  leadId,
  documents,
  clientAttachmentKeys,
  onMutated,
}: LeadDocumentsPanelProps) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const afterMutation = () => {
    router.refresh()
    onMutated?.()
  }

  const attachDocument = async (payload: {
    fileKey: string
    fileName: string
    mimeType?: string
    direction: LeadDocumentDirection
    category: LeadDocumentCategory
  }) => {
    const res = await fetch(`/api/admin/leads/${leadId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error()
  }

  const handleMediaLibrarySelect = async (publicUrl: string) => {
    setPickerOpen(false)
    try {
      const fileKey = publicUrl.replace(`${ASSETS_BASE_URL}/`, '')
      const fileName = fileKey.split('/').pop() ?? fileKey
      await attachDocument({
        fileKey,
        fileName,
        direction: 'admin_sent',
        category: 'other',
      })
      toast.success('Document attached')
      afterMutation()
    } catch {
      toast.error('Could not attach document')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset the input so the same file can be re-selected later.
    e.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      // 1. Request a presigned URL.
      const presignRes = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: 'leads',
          filename: file.name,
          contentType: file.type,
          folder: leadId,
        }),
      })
      if (!presignRes.ok) {
        const errorBody = await presignRes.json().catch(() => null)
        const detail =
          errorBody?.details?.[0]?.message ?? errorBody?.error ?? undefined
        throw new Error(detail)
      }
      const { presignedUrl, key } = await presignRes.json()

      // 2. PUT the file directly to R2 via the presigned URL.
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!putRes.ok) throw new Error()

      // 3. Register the document against the lead.
      await attachDocument({
        fileKey: key,
        fileName: file.name,
        mimeType: file.type,
        direction: 'admin_sent',
        category: 'other',
      })

      toast.success('File uploaded')
      afterMutation()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : null
      toast.error(
        message ? `Could not upload file: ${message}` : 'Could not upload file'
      )
    } finally {
      setUploading(false)
    }
  }

  const archiveDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/documents/${documentId}/archive`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Document deleted')
      afterMutation()
    } catch {
      toast.error('Could not delete document')
    }
  }

  const restoreDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/documents/${documentId}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Document restored')
      afterMutation()
    } catch {
      toast.error('Could not restore document')
    }
  }

  const visibleDocuments = documents.filter((d) =>
    showArchived ? d.archivedAt !== null : d.archivedAt === null
  )

  const hasArchived = documents.some((d) => d.archivedAt !== null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setPickerOpen(true)}>
          Attach from Media Library
        </Button>
        <Button
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload new file'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-2">
        {visibleDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No documents yet.
          </p>
        ) : (
          visibleDocuments.map((doc) => {
            const href = `${ASSETS_BASE_URL}/${doc.fileKey}`
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  {doc.direction === 'admin_sent' ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium underline underline-offset-2 break-all"
                    >
                      {doc.fileName}
                    </a>
                  ) : (
                    <p className="text-sm font-medium break-all">{doc.fileName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Badge variant="secondary">{CATEGORY_LABELS[doc.category]}</Badge>
                  <Badge variant="outline">{DIRECTION_LABELS[doc.direction]}</Badge>
                  {doc.archivedAt ? (
                    <Button size="sm" variant="outline" onClick={() => restoreDocument(doc.id)}>
                      Restore
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => archiveDocument(doc.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {hasArchived && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-fluid-xs underline"
          style={{ color: 'var(--neutral-600)' }}
        >
          {showArchived ? 'Hide deleted documents' : 'Show deleted documents'}
        </button>
      )}

      {clientAttachmentKeys.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Client&apos;s original attachments</h3>
          <QuoteAttachmentsGrid leadId={leadId} fileKeys={clientAttachmentKeys} />
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleMediaLibrarySelect}
      />
    </div>
  )
}
