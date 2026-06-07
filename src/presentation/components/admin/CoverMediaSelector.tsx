'use client'

import { useState, useRef } from 'react'
import { Film, Image as ImageIcon, Upload, X } from 'lucide-react'
import { MediaPickerModal } from '@/presentation/components/admin/MediaPickerModal'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'

interface CoverMediaSelectorProps {
  coverUrl: string | null
  posterUrl: string | null
  onChange: (coverUrl: string | null, posterUrl: string | null) => void
  folder?: string
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export function CoverMediaSelector({ coverUrl, posterUrl, onChange, folder }: CoverMediaSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [posterPickerOpen, setPosterPickerOpen] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)

  const coverIsVideo = coverUrl ? isVideo(coverUrl) : false

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const prefix = file.type.startsWith('video/') ? 'projects/video' : 'projects/cover'
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
      const result = await uploadFileToR2(file, 'projects/cover', undefined, folder)
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
      <p className="text-sm font-medium" style={{ color: '#2D2924' }}>Cover Media</p>

      {/* Cover preview */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ aspectRatio: '16/9', backgroundColor: '#F5EFE8', border: '1px solid #E5DDD0' }}
      >
        {!coverUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: '#A89E8C' }}>
            <ImageIcon size={36} className="opacity-40" />
            <p className="text-sm">No cover selected</p>
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
            <X size={14} />
          </button>
        )}
      </div>

      {/* Cover action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(226,192,99,0.4)', color: '#E2C063', backgroundColor: 'rgba(226,192,99,0.08)' }}
        >
          <Film size={14} />
          Browse Library
        </button>

        <input ref={coverInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleCoverUpload} />
        <button
          type="button"
          disabled={uploadingCover}
          onClick={() => coverInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
          style={{ border: '1px solid #E5DDD0', color: '#6B6560' }}
        >
          <Upload size={14} />
          {uploadingCover ? 'Uploading…' : 'Upload File'}
        </button>
      </div>

      {/* Poster image (only shown when cover is video) */}
      {coverIsVideo && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.12)' }}
        >
          <p className="text-sm font-medium" style={{ color: '#2D2924' }}>
            Poster Image
            <span className="ml-2 text-xs font-normal" style={{ color: '#A89E8C' }}>(fallback for video)</span>
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
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPosterPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid rgba(226,192,99,0.4)', color: '#E2C063', backgroundColor: 'rgba(226,192,99,0.08)' }}
            >
              Browse Library
            </button>

            <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
            <button
              type="button"
              disabled={uploadingPoster}
              onClick={() => posterInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
              style={{ border: '1px solid #E5DDD0', color: '#6B6560' }}
            >
              <Upload size={12} />
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
        onSelect={(url) => {
          onChange(url, isVideo(url) ? posterUrl : null)
          setPickerOpen(false)
        }}
      />

      <MediaPickerModal
        open={posterPickerOpen}
        onClose={() => setPosterPickerOpen(false)}
        allowVideo={false}
        onSelect={(url) => {
          onChange(coverUrl, url)
          setPosterPickerOpen(false)
        }}
      />
    </div>
  )
}
