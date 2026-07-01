'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'
import { MediaPickerModal } from '@/presentation/components/admin/MediaPickerModal'

interface Props {
  desktopImageUrl?: string
  mobileImageUrl?: string
  onChange: (desktop: string | undefined, mobile: string | undefined) => void
}

interface ZoneProps {
  label: string
  imageUrl?: string
  aspectStyle: React.CSSProperties
  onUpload: (url: string) => void
  onRemove: () => void
  onBrowse: () => void
  uploading: boolean
  progress: number
}

function ImageZone({ label, imageUrl, aspectStyle, onUpload, onRemove, onBrowse, uploading, progress }: ZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    try {
      const result = await uploadFileToR2(file, 'hero', (pct) => {
        void pct
      })
      onUpload(result.publicUrl)
    } catch {
      // error surfaced via toast in parent
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <div
        style={{
          ...aspectStyle,
          position: 'relative',
          border: imageUrl ? 'none' : '2px dashed #E5DDD0',
          borderRadius: 8,
          overflow: 'hidden',
          background: imageUrl ? 'transparent' : '#FAF6F0',
          cursor: uploading ? 'wait' : 'default',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={onRemove}
              style={{
                position: 'absolute', top: 6, right: 6, zIndex: 2,
                background: 'rgba(18,14,10,0.7)', border: 'none', borderRadius: 4,
                color: '#fff', width: 24, height: 24, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ImageIcon size={24} color="#C5B99A" />
            <span style={{ fontSize: '0.75rem', color: '#6B6560', textAlign: 'center' }}>
              Drop image or click to upload
            </span>
          </div>
        )}
        {uploading && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#E5DDD0' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#E2C063', transition: 'width 0.1s' }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{
            fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: '1px solid #E5DDD0',
            background: '#fff', color: '#2D2924', cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, opacity: uploading ? 0.5 : 1,
          }}
        >
          <Upload size={11} /> Upload file
        </button>
        <button
          disabled={uploading}
          onClick={onBrowse}
          style={{
            fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: '1px solid #E5DDD0',
            background: '#fff', color: '#2D2924', cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.5 : 1,
          }}
        >
          Browse library
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}

export function HeroImagePair({ desktopImageUrl, mobileImageUrl, onChange }: Props) {
  const [desktopProgress, setDesktopProgress] = useState(0)
  const [mobileProgress, setMobileProgress] = useState(0)
  const [desktopUploading, setDesktopUploading] = useState(false)
  const [mobileUploading, setMobileUploading] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<'desktop' | 'mobile' | null>(null)

  async function handleDesktopUpload(file: File) {
    setDesktopUploading(true)
    try {
      const result = await uploadFileToR2(file, 'hero', (pct) => setDesktopProgress(pct))
      onChange(result.publicUrl, mobileImageUrl)
    } finally {
      setDesktopUploading(false)
      setDesktopProgress(0)
    }
  }

  async function handleMobileUpload(file: File) {
    setMobileUploading(true)
    try {
      const result = await uploadFileToR2(file, 'hero', (pct) => setMobileProgress(pct))
      onChange(desktopImageUrl, result.publicUrl)
    } finally {
      setMobileUploading(false)
      setMobileProgress(0)
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <ImageZone
          label="Desktop image"
          imageUrl={desktopImageUrl}
          aspectStyle={{ aspectRatio: '16/9' }}
          onUpload={(url) => onChange(url, mobileImageUrl)}
          onRemove={() => onChange(undefined, mobileImageUrl)}
          onBrowse={() => setPickerTarget('desktop')}
          uploading={desktopUploading}
          progress={desktopProgress}
        />
        <ImageZone
          label="Mobile image"
          imageUrl={mobileImageUrl}
          aspectStyle={{ aspectRatio: '9/16', maxHeight: 240 }}
          onUpload={(url) => onChange(desktopImageUrl, url)}
          onRemove={() => onChange(desktopImageUrl, undefined)}
          onBrowse={() => setPickerTarget('mobile')}
          uploading={mobileUploading}
          progress={mobileProgress}
        />
      </div>

      <MediaPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(publicUrl: string) => {
          if (pickerTarget === 'desktop') onChange(publicUrl, mobileImageUrl)
          else onChange(desktopImageUrl, publicUrl)
          setPickerTarget(null)
        }}
      />

      {/* Hidden file inputs for upload (handled by ImageZone via uploadFileToR2 directly) */}
      {desktopUploading && (
        <input
          type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDesktopUpload(f) }}
        />
      )}
      {mobileUploading && (
        <input
          type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMobileUpload(f) }}
        />
      )}
    </>
  )
}
