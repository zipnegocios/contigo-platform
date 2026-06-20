'use client'

import { useEffect, useState } from 'react'
import { Download, File, Loader2 } from 'lucide-react'
import { AttachmentLightbox } from './AttachmentLightbox'
import { inferMediaType } from '@/core/lib/inferMediaType'

interface QuoteAttachmentsGridProps {
  leadId: string
  fileKeys: string[]
}

interface AttachmentUrlState {
  [key: string]: string | 'loading' | 'error'
}

export function QuoteAttachmentsGrid({ leadId, fileKeys }: QuoteAttachmentsGridProps) {
  const [urls, setUrls] = useState<AttachmentUrlState>({})
  const [lightboxKey, setLightboxKey] = useState<string | null>(null)

  useEffect(() => {
    fileKeys.forEach((key) => {
      if (urls[key]) return
      setUrls((prev) => ({ ...prev, [key]: 'loading' }))
      fetch(`/api/admin/leads/${leadId}/attachments?key=${encodeURIComponent(key)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load')
          return res.json()
        })
        .then((json) => setUrls((prev) => ({ ...prev, [key]: json.url })))
        .catch(() => setUrls((prev) => ({ ...prev, [key]: 'error' })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, fileKeys.join(',')])

  if (fileKeys.length === 0) return null

  return (
    <>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
        {fileKeys.map((key) => {
          const fileName = key.split('/').pop() ?? key
          const mediaType = inferMediaType(key)
          const state = urls[key]

          return (
            <div key={key} className="space-y-1.5">
              <button
                type="button"
                onClick={() => state && state !== 'loading' && state !== 'error' && setLightboxKey(key)}
                disabled={!state || state === 'loading' || state === 'error'}
                className="relative w-full rounded-lg overflow-hidden flex items-center justify-center"
                style={{ aspectRatio: '1/1', backgroundColor: 'var(--neutral-50)', border: '1px solid #E5DDD0' }}
              >
                {state === 'loading' || !state ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--neutral-600)' }} />
                ) : state === 'error' ? (
                  <span className="text-fluid-xs px-2 text-center" style={{ color: 'var(--neutral-600)' }}>Failed to load</span>
                ) : mediaType === 'image' ? (
                  <img src={state} alt={fileName} className="w-full h-full object-cover" />
                ) : (
                  <File className="w-6 h-6" style={{ color: 'var(--neutral-600)' }} />
                )}
              </button>
              <div className="flex items-center justify-between gap-1">
                <p className="text-fluid-xs truncate flex-1" style={{ color: 'var(--neutral-600)' }} title={fileName}>
                  {fileName}
                </p>
                {state && state !== 'loading' && state !== 'error' && (
                  <a
                    href={state}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1 rounded hover:bg-black/5"
                    style={{ color: 'var(--neutral-600)' }}
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {lightboxKey && urls[lightboxKey] && urls[lightboxKey] !== 'loading' && urls[lightboxKey] !== 'error' && (
        <AttachmentLightbox
          fileName={lightboxKey.split('/').pop() ?? lightboxKey}
          url={urls[lightboxKey] as string}
          mediaType={inferMediaType(lightboxKey)}
          onClose={() => setLightboxKey(null)}
        />
      )}
    </>
  )
}
