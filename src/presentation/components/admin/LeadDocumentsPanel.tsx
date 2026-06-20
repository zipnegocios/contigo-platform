'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { MediaPickerModal } from './MediaPickerModal'
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
}

interface LeadDocumentsPanelProps {
  leadId: string
  documents: LeadDocumentItem[]
  clientAttachmentKeys: string[]
}

const ASSETS_BASE_URL =
  process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'

const DIRECTION_LABELS: Record<LeadDocumentDirection, string> = {
  client_upload: 'Recibido del cliente',
  admin_sent: 'Enviado al cliente',
  internal: 'Interno',
}

const CATEGORY_LABELS: Record<LeadDocumentCategory, string> = {
  reference_photo: 'Foto de referencia',
  site_photo: 'Foto de obra',
  quote_pdf: 'PDF de cotización',
  contract: 'Contrato',
  other: 'Otro',
}

export function LeadDocumentsPanel({
  leadId,
  documents,
  clientAttachmentKeys,
}: LeadDocumentsPanelProps) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      toast.success('Documento adjuntado')
      router.refresh()
    } catch {
      toast.error('No se pudo adjuntar el documento')
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

      toast.success('Archivo subido')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : null
      toast.error(
        message ? `No se pudo subir el archivo: ${message}` : 'No se pudo subir el archivo'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setPickerOpen(true)}>
          Adjuntar desde Media Library
        </Button>
        <Button
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Subiendo…' : 'Subir nuevo archivo'}
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
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sin documentos todavía.
          </p>
        ) : (
          documents.map((doc) => {
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
                </div>
              </div>
            )
          })
        )}
      </div>

      {clientAttachmentKeys.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Adjuntos originales del cliente</h3>
          <div className="space-y-2">
            {clientAttachmentKeys.map((key, i) => (
              <div
                key={i}
                className="rounded px-3 py-2 text-xs font-mono break-all"
                style={{
                  backgroundColor: 'var(--neutral-50)',
                  border: '1px solid #E5DDD0',
                  color: '#6B6560',
                }}
              >
                {key}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            These are stored in the private <code className="font-mono">contigo-quotes</code>{' '}
            bucket. Presigned view URLs will be added in a future update.
          </p>
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
