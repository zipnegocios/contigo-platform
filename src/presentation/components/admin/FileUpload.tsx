'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'

type AllowedPrefix = 'projects/cover' | 'projects/gallery' | 'services'

interface FileUploadProps {
  value: string | null
  onChange: (url: string) => void
  prefix: AllowedPrefix
  label: string
  accept?: string
}

type UploadState = 'idle' | 'uploading' | 'error'

export function FileUpload({
  value,
  onChange,
  prefix,
  label,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setState('uploading')
    setErrorMsg(null)
    setProgress(0)

    try {
      const { publicUrl } = await uploadFileToR2(file, prefix, setProgress)
      onChange(publicUrl)
      setState('idle')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClear = () => {
    onChange('')
    setState('idle')
    setErrorMsg(null)
  }

  const isExternalImage = value && (
    value.startsWith('https://assets.contigoconstructions.com.au') ||
    value.startsWith('https://')
  )

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: '#2D2924' }}>
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Upload ${label}`}
      />

      {value ? (
        /* Preview */
        <div
          className="relative rounded-lg overflow-hidden"
          style={{ border: '1px solid #E5DDD0' }}
        >
          <div className="relative w-full h-48 bg-[#FAF6F0]">
            {isExternalImage ? (
              <Image
                src={value}
                alt={label}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-8 w-8" style={{ color: '#C5BDB5' }} />
              </div>
            )}
          </div>
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ backgroundColor: '#FAF6F0', borderTop: '1px solid #E5DDD0' }}
          >
            <p className="text-xs truncate max-w-[80%]" style={{ color: '#6B6560' }}>
              {value.split('/').pop()}
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: '#A89E8C' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#A89E8C' }}
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Upload zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state === 'uploading'}
          className="w-full rounded-lg border-2 border-dashed py-8 flex flex-col items-center gap-3 transition-all"
          style={{
            borderColor: state === 'error' ? '#dc2626' : '#E5DDD0',
            backgroundColor: '#FAF6F0',
            cursor: state === 'uploading' ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (state !== 'uploading') e.currentTarget.style.borderColor = '#E2C063'
          }}
          onMouseLeave={(e) => {
            if (state !== 'uploading') e.currentTarget.style.borderColor = state === 'error' ? '#dc2626' : '#E5DDD0'
          }}
        >
          {state === 'uploading' ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#E2C063' }} />
              <span className="text-sm" style={{ color: '#6B6560' }}>
                Uploading… {progress}%
              </span>
              {/* Progress bar */}
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E5DDD0' }}>
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{ width: `${progress}%`, backgroundColor: '#E2C063' }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6" style={{ color: '#C5BDB5' }} />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#2D2924' }}>
                  Click to upload
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#A89E8C' }}>
                  JPG, PNG, WebP, GIF
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {state === 'error' && errorMsg && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
