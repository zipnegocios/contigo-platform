'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, X, Loader2, ImageIcon } from 'lucide-react'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'

interface GalleryUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  prefix?: 'projects/gallery'
  maxImages?: number
}

export function GalleryUpload({
  value,
  onChange,
  prefix = 'projects/gallery',
  maxImages = 20,
}: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

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
      const { publicUrl } = await uploadFileToR2(file, prefix, setProgress)
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: '#2D2924' }}>
        Gallery Images
        <span className="ml-2 text-xs font-normal" style={{ color: '#A89E8C' }}>
          ({value.length}/{maxImages})
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Add gallery image"
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Existing thumbnails */}
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative rounded-lg overflow-hidden group"
            style={{ border: '1px solid #E5DDD0', aspectRatio: '1' }}
          >
            {url.startsWith('https://') ? (
              <Image
                src={url}
                alt={`Gallery image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 200px"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#FAF6F0]">
                <ImageIcon className="h-6 w-6" style={{ color: '#C5BDB5' }} />
              </div>
            )}
            {/* Remove overlay */}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(45,41,36,0.5)' }}
              aria-label={`Remove image ${index + 1}`}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        ))}

        {/* Add button */}
        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
            style={{
              borderColor: '#E5DDD0',
              backgroundColor: '#FAF6F0',
              aspectRatio: '1',
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!uploading) e.currentTarget.style.borderColor = '#E2C063'
            }}
            onMouseLeave={(e) => {
              if (!uploading) e.currentTarget.style.borderColor = '#E5DDD0'
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
                <span className="text-xs" style={{ color: '#A89E8C' }}>Add</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  )
}
