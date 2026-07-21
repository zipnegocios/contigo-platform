'use client'

import { useState, useRef } from 'react'
import { Film, Image as ImageIcon, Upload, X } from 'lucide-react'
import { MediaPickerModal } from '@/presentation/components/admin/MediaPickerModal'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'
import type { EntityContext } from '@/presentation/components/admin/MediaLibraryContext'

interface CoverMediaSelectorProps {
  coverUrl: string | null
  posterUrl: string | null
  onChange: (coverUrl: string | null, posterUrl: string | null) => void
  folder?: string
  entityContext?: EntityContext | null
  entityType?: 'project' | 'service'
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export function CoverMediaSelector({ coverUrl, posterUrl, onChange, folder, entityContext, entityType }: CoverMediaSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [posterPickerOpen, setPosterPickerOpen] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)

  const coverIsVideo = coverUrl ? isVideo(coverUrl) : false

  const finalEntityType = entityType || entityContext?.type || 'project'
  const entityDir = finalEntityType === 'service' ? 'services' : 'projects'

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const prefix = file.type.startsWith('video/') ? `${entityDir}/videos` : `${entityDir}/covers`
      const result = await uploadFileToR2(file, prefix, undefined, folder)
      onChange(result.publicUrl, file.type.startsWith('video/') ? posterUrl : null)
    } catch (err) {
      console.error(err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  async function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPoster(true)
    try {
      const result = await uploadFileToR2(file, `${entityDir}/covers`, undefined, folder)
      onChange(coverUrl, result.publicUrl)
    } catch (err) {
      console.error(err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploadingPoster(false)
      if (posterInputRef.current) posterInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Cover Media</p>

      {/* Cover preview */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ aspectRatio: '16/9', backgroundColor: '#F5EFE8', border: '1px solid #E5DDD0' }}
      >
        {!coverUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: 'var(--neutral-600)' }}>
            <ImageIcon className="w-[clamp(1.75rem,3.5vw,2.25rem)] h-[clamp(1.75rem,3.5vw,2.25rem)] opacity-40" />
            <p className="text-fluid-sm">No cover selected</p>
          </div>
        ) : coverIsVideo ? (
          <video
            src={coverUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            poster={posterUrl ?? undefined}
          />
        ) : (
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        )}

        {coverUrl && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="absolute top-2 right-2 p-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(232,112,112,0.18)', color: '#e87070' }}
            title="Remove cover"
          >
            <X className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          </button>
        )}
      </div>

      {/* Cover action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-fluid-sm font-medium transition-all"
          style={{ border: '1px solid rgba(226,192,99,0.4)', color: 'var(--contigo-primary)', backgroundColor: 'rgba(226,192,99,0.08)' }}
        >
          <Film className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          Browse Library
        </button>

        <input ref={coverInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleCoverUpload} />
        <button
          type="button"
          disabled={uploadingCover}
          onClick={() => coverInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-fluid-sm font-medium transition-all disabled:opacity-60"
          style={{ border: '1px solid #E5DDD0', color: '#6B6560' }}
        >
          <Upload className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          {uploadingCover ? 'Uploading…' : 'Upload File'}
        </button>
      </div>

      {/* Poster image (only shown when cover is video) */}
      {coverIsVideo && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.12)' }}
        >
          <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
            Poster Image
            <span className="ml-2 text-fluid-xs font-normal" style={{ color: 'var(--neutral-600)' }}>(fallback for video)</span>
          </p>

          {posterUrl && (
            <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '16/9', maxWidth: 200 }}>
              <img src={posterUrl} alt="Poster" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(coverUrl, null)}
                className="absolute top-1 right-1 p-1 rounded-full"
                style={{ backgroundColor: 'rgba(232,112,112,0.18)', color: '#e87070' }}
              >
                <X className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
              </button>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPosterPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-fluid-xs font-medium transition-all"
              style={{ border: '1px solid rgba(226,192,99,0.4)', color: 'var(--contigo-primary)', backgroundColor: 'rgba(226,192,99,0.08)' }}
            >
              Browse Library
            </button>

            <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
            <button
              type="button"
              disabled={uploadingPoster}
              onClick={() => posterInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-fluid-xs font-medium transition-all disabled:opacity-60"
              style={{ border: '1px solid #E5DDD0', color: '#6B6560' }}
            >
              <Upload className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
              {uploadingPoster ? 'Uploading…' : 'Upload Image'}
            </button>
          </div>
        </div>
      )}

      {/* Media pickers */}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        allowVideo={true}
        entityContext={entityContext}
        onSelect={(url) => {
          onChange(url, isVideo(url) ? posterUrl : null)
          setPickerOpen(false)
        }}
      />

      <MediaPickerModal
        open={posterPickerOpen}
        onClose={() => setPosterPickerOpen(false)}
        allowVideo={false}
        entityContext={entityContext}
        onSelect={(url) => {
          onChange(coverUrl, url)
          setPosterPickerOpen(false)
        }}
      />
    </div>
  )
}
