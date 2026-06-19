'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2, Images } from 'lucide-react'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'
import { MediaPickerModal } from './MediaPickerModal'

type AllowedPrefix = 'projects/cover' | 'projects/gallery' | 'services'

interface FileUploadProps {
  value: string | null
  onChange: (url: string) => void
  prefix: AllowedPrefix
  label: string
  accept?: string
  folder?: string
}

type UploadState = 'idle' | 'uploading' | 'error'

export function FileUpload({
  value,
  onChange,
  prefix,
  label,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  folder,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setState('uploading')
    setErrorMsg(null)
    setProgress(0)

    try {
      const { publicUrl } = await uploadFileToR2(file, prefix, setProgress, folder)
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

  return (
    <div className="space-y-2">
      <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
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

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => { onChange(url); setState('idle') }}
      />

      {value ? (
        /* Preview */
        <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid #E5DDD0' }}>
          <div className="relative w-full bg-[#FAF6F0]" style={{ height: 'clamp(8rem,20vh,12rem)' }}>
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ backgroundColor: 'var(--neutral-50)', borderTop: '1px solid #E5DDD0' }}
          >
            <p className="text-fluid-xs truncate max-w-[60%]" style={{ color: '#6B6560' }}>
              {value.split('/').pop()}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1 text-fluid-xs transition-colors"
                style={{ color: 'var(--neutral-600)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--contigo-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--neutral-600)' }}
              >
                <Images className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                Change
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-fluid-xs transition-colors"
                style={{ color: 'var(--neutral-600)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--neutral-600)' }}
              >
                <X className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload zone */
        <div
          className="w-full rounded-lg border-2 border-dashed overflow-hidden"
          style={{ borderColor: state === 'error' ? '#dc2626' : 'var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}
        >
          {state === 'uploading' ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="w-[clamp(1.25rem,2.5vw,1.5rem)] h-[clamp(1.25rem,2.5vw,1.5rem)] animate-spin" style={{ color: 'var(--contigo-primary)' }} />
              <span className="text-fluid-sm" style={{ color: '#6B6560' }}>Uploading… {progress}%</span>
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-200)' }}>
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{ width: `${progress}%`, backgroundColor: 'var(--contigo-primary)' }}
                />
              </div>
            </div>
          ) : (
            <div className="flex" style={{ border: 'none' }}>
              {/* Upload from computer */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex-1 py-8 flex flex-col items-center gap-3 transition-all hover:bg-[#F5F0E8]"
                style={{ cursor: 'pointer' }}
              >
                <Upload className="w-[clamp(1.25rem,2.5vw,1.5rem)] h-[clamp(1.25rem,2.5vw,1.5rem)]" style={{ color: '#C5BDB5' }} />
                <div className="text-center">
                  <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Upload file</p>
                  <p className="text-fluid-xs mt-0.5" style={{ color: 'var(--neutral-600)' }}>JPG, PNG, WebP, GIF</p>
                </div>
              </button>

              {/* Divider */}
              <div style={{ width: 1, backgroundColor: 'var(--neutral-200)' }} />

              {/* Browse library */}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex-1 py-8 flex flex-col items-center gap-3 transition-all hover:bg-[#F5F0E8]"
                style={{ cursor: 'pointer' }}
              >
                <Images className="w-[clamp(1.25rem,2.5vw,1.5rem)] h-[clamp(1.25rem,2.5vw,1.5rem)]" style={{ color: '#C5BDB5' }} />
                <div className="text-center">
                  <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Browse library</p>
                  <p className="text-fluid-xs mt-0.5" style={{ color: 'var(--neutral-600)' }}>Select existing</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {state === 'error' && errorMsg && (
        <p className="text-fluid-xs" style={{ color: '#dc2626' }}>{errorMsg}</p>
      )}
    </div>
  )
}
