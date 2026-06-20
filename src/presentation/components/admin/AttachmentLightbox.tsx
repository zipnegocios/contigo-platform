'use client'

import { X, Download, File } from 'lucide-react'
import type { InferredMediaType } from '@/presentation/lib/inferMediaType'

interface AttachmentLightboxProps {
  fileName: string
  url: string
  mediaType: InferredMediaType
  onClose: () => void
}

export function AttachmentLightbox({ fileName, url, mediaType, onClose }: AttachmentLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative rounded-2xl max-w-2xl w-full overflow-hidden"
        style={{ backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}>
          <h2 className="text-fluid-base font-semibold truncate pr-4" style={{ color: 'var(--neutral-50)', fontFamily: 'var(--font-cormorant)' }}>
            {fileName}
          </h2>
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg min-h-[44px] min-w-[44px]" style={{ color: 'var(--neutral-600)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-5">
          <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', backgroundColor: '#150F0A' }}>
            {mediaType === 'image' ? (
              <img src={url} alt={fileName} className="w-full h-full object-contain" />
            ) : mediaType === 'video' ? (
              <video src={url} controls className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-600)' }}>
                <File className="w-8 h-8" />
                <span className="text-fluid-xs">No preview available</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4">
          <a
            href={url}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-fluid-sm font-medium"
            style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: 'var(--contigo-primary)' }}
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
