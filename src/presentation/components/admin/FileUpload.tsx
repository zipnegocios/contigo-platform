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
  const [pickerOpen, setPickerOpen] = useState(false)

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

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => { onChange(url); setState('idle') }}
        defaultTab={prefix === 'services' ? 'services' : 'cover'}
      />

      {value ? (
        /* Preview */
        <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid #E5DDD0' }}>
          <div className="relative w-full h-48 bg-[#FAF6F0]">
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ backgroundColor: '#FAF6F0', borderTop: '1px solid #E5DDD0' }}
          >
            <p className="text-xs truncate max-w-[60%]" style={{ color: '#6B6560' }}>
              {value.split('/').pop()}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: '#A89E8C' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#E2C063' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#A89E8C' }}
              >
                <Images className="h-3.5 w-3.5" />
                Change
              </button>
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
        </div>
      ) : (
        /* Upload zone */
        <div
          className="w-full rounded-lg border-2 border-dashed overflow-hidden"
          style={{ borderColor: state === 'error' ? '#dc2626' : '#E5DDD0', backgroundColor: '#FAF6F0' }}
        >
          {state === 'uploading' ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#E2C063' }} />
              <span className="text-sm" style={{ color: '#6B6560' }}>Uploading… {progress}%</span>
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E5DDD0' }}>
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{ width: `${progress}%`, backgroundColor: '#E2C063' }}
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
                <Upload className="h-6 w-6" style={{ color: '#C5BDB5' }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: '#2D2924' }}>Upload file</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A89E8C' }}>JPG, PNG, WebP, GIF</p>
                </div>
              </button>

              {/* Divider */}
              <div style={{ width: 1, backgroundColor: '#E5DDD0' }} />

              {/* Browse library */}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex-1 py-8 flex flex-col items-center gap-3 transition-all hover:bg-[#F5F0E8]"
                style={{ cursor: 'pointer' }}
              >
                <Images className="h-6 w-6" style={{ color: '#C5BDB5' }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: '#2D2924' }}>Browse library</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A89E8C' }}>Select existing</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {state === 'error' && errorMsg && (
        <p className="text-xs" style={{ color: '#dc2626' }}>{errorMsg}</p>
      )}
    </div>
  )
}
