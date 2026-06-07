'use client'

import { useRef, useState } from 'react'
import { Plus, X, Loader2, Images } from 'lucide-react'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'
import { MediaPickerModal } from './MediaPickerModal'

interface GalleryUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  prefix?: 'projects/gallery'
  maxImages?: number
  folder?: string
}

export function GalleryUpload({
  value,
  onChange,
  prefix = 'projects/gallery',
  maxImages = 20,
  folder,
}: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (value.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const { publicUrl } = await uploadFileToR2(file, prefix, setProgress, folder)
      onChange([...value, publicUrl])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handlePickerMultiSelect = (urls: string[]) => {
    const existing = new Set(value)
    const incoming = urls.filter((u) => !existing.has(u))
    const combined = [...value, ...incoming]
    onChange(combined.slice(0, maxImages))
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: '#2D2924' }}>
        Gallery
        <span className="ml-2 text-xs font-normal" style={{ color: '#A89E8C' }}>
          ({value.length}/{maxImages})
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Add gallery item"
      />

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={() => {}}
        onMultiSelect={handlePickerMultiSelect}
        multiSelect
        defaultTab="gallery"
        allowVideo
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Existing thumbnails */}
        {value.map((url, index) => {
          const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
          return (
            <div
              key={`${url}-${index}`}
              className="relative rounded-lg overflow-hidden group"
              style={{ border: '1px solid #E5DDD0', aspectRatio: '1', backgroundColor: '#1E1A16' }}
            >
              {isVideo ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs" style={{ color: '#A89E8C' }}>Video</span>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(45,41,36,0.5)' }}
                aria-label={`Remove item ${index + 1}`}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          )
        })}

        {/* Upload new */}
        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-[#E2C063]"
            style={{
              borderColor: '#E5DDD0',
              backgroundColor: '#FAF6F0',
              aspectRatio: '1',
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#E2C063' }} />
                <span className="text-xs" style={{ color: '#6B6560' }}>{progress}%</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" style={{ color: '#C5BDB5' }} />
                <span className="text-xs" style={{ color: '#A89E8C' }}>Upload</span>
              </>
            )}
          </button>
        )}

        {/* Browse library */}
        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-[#E2C063]"
            style={{
              borderColor: '#E5DDD0',
              backgroundColor: '#FAF6F0',
              aspectRatio: '1',
              cursor: 'pointer',
            }}
          >
            <Images className="h-5 w-5" style={{ color: '#C5BDB5' }} />
            <span className="text-xs" style={{ color: '#A89E8C' }}>Library</span>
          </button>
        )}
      </div>

      {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}
