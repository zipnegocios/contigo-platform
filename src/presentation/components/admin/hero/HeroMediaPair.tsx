'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, X, ImageIcon, Video as VideoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'
import { extractMediaMetadata, formatDuration } from '@/presentation/lib/extractMediaMetadata'
import { MediaPickerModal } from '@/presentation/components/admin/MediaPickerModal'
import { isVideoUrl } from '@/presentation/lib/media-type'
import {
  DEFAULT_HERO_VIDEO_SETTINGS,
  type HeroMedia,
  type HeroVideoAudio,
  type HeroVideoSettings,
} from '@/core/entities/HeroConfig'

const WARN_VIDEO_BYTES = 20 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

interface Props {
  desktopMedia?: HeroMedia
  mobileMedia?: HeroMedia
  onChange: (desktop: HeroMedia | undefined, mobile: HeroMedia | undefined) => void
}

type Slot = 'desktop' | 'mobile'
type PickerTarget = { slot: Slot; purpose: 'media' | 'poster' } | null

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4, display: 'block',
}
const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '0.8rem', padding: '5px 8px', borderRadius: 6,
  border: '1px solid #E5DDD0', background: '#fff', color: '#2D2924',
}
const smallBtn = (disabled?: boolean): React.CSSProperties => ({
  fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: '1px solid #E5DDD0',
  background: '#fff', color: '#2D2924', cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', gap: 4, opacity: disabled ? 0.5 : 1,
})

const AUDIO_OPTIONS: { value: HeroVideoAudio; label: string }[] = [
  { value: 'off', label: 'No sound (always muted)' },
  { value: 'muted_toggle', label: 'Starts muted, visitor can unmute' },
  { value: 'on', label: 'Starts with sound (browser may block)' },
]

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

interface ZoneProps {
  label: string
  slot: Slot
  media?: HeroMedia
  aspectStyle: React.CSSProperties
  onChange: (media: HeroMedia | undefined) => void
  onBrowse: (purpose: 'media' | 'poster') => void
  duration?: number
  onDuration: (seconds: number | undefined) => void
}

function MediaZone({ label, slot, media, aspectStyle, onChange, onBrowse, duration, onDuration }: ZoneProps) {
  const mediaInput = useRef<HTMLInputElement>(null)
  const posterInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  // Local so the switch works on an empty slot; follows the media whenever one is present.
  const [mode, setModeState] = useState<'image' | 'video'>(media?.type ?? 'image')
  useEffect(() => {
    if (media?.type) setModeState(media.type)
  }, [media?.type])

  function setMode(next: 'image' | 'video') {
    if (next === mode) return
    setModeState(next)
    // Switching kind discards the current file: an image URL isn't a video and vice versa.
    if (media) {
      onChange(undefined)
      onDuration(undefined)
    }
  }

  async function upload(file: File, purpose: 'media' | 'poster') {
    if (purpose === 'media' && mode === 'video') {
      if (file.size > MAX_VIDEO_BYTES) {
        toast.error(`Video is ${(file.size / 1048576).toFixed(0)} MB — max is 50 MB. Compress it first.`)
        return
      }
      if (file.size > WARN_VIDEO_BYTES) {
        toast.warning('Large video (>20 MB). It may load slowly on mobile; consider compressing it.')
      }
    }
    setUploading(true)
    setProgress(0)
    try {
      const result = await uploadFileToR2(file, 'hero', setProgress)
      if (purpose === 'poster') {
        if (media) onChange({ ...media, posterUrl: result.publicUrl })
      } else if (mode === 'video') {
        const meta = await extractMediaMetadata(file)
        onDuration(meta.duration)
        onChange({
          type: 'video',
          url: result.publicUrl,
          posterUrl: media?.posterUrl,
          video: { ...DEFAULT_HERO_VIDEO_SETTINGS, ...media?.video, endTime: undefined, startTime: undefined },
        })
      } else {
        onChange({ type: 'image', url: result.publicUrl })
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  function patchVideo(patch: Partial<HeroVideoSettings>) {
    if (!media || media.type !== 'video') return
    onChange({ ...media, video: { ...DEFAULT_HERO_VIDEO_SETTINGS, ...media.video, ...patch } })
  }

  const hasVideo = media?.type === 'video'
  const video = { ...DEFAULT_HERO_VIDEO_SETTINGS, ...(media?.type === 'video' ? media.video : undefined) }
  const start = video?.startTime
  const end = video?.endTime
  const rangeInvalid =
    (start !== undefined && start < 0) ||
    (end !== undefined && end <= (start ?? 0)) ||
    (duration !== undefined && ((end ?? 0) > duration || (start ?? 0) >= duration))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        <div
          role="group"
          aria-label={`${label} media type`}
          style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 3, borderRadius: 999, background: '#EFE8DA', width: 168 }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc(50% - 3px)', borderRadius: 999,
              background: '#2D2924', transition: 'transform 0.2s ease',
              transform: mode === 'video' ? 'translateX(100%)' : 'translateX(0)',
            }}
          />
          {(['image', 'video'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              style={{
                position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                fontSize: '0.75rem', padding: '5px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                color: mode === m ? '#FAF6F0' : '#6B6560', fontWeight: 600, transition: 'color 0.2s ease',
              }}
            >
              {m === 'image' ? <ImageIcon size={13} /> : <VideoIcon size={13} />}
              {m === 'image' ? 'Image' : 'Video'}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          ...aspectStyle,
          position: 'relative',
          border: media?.url ? 'none' : '2px dashed #E5DDD0',
          borderRadius: 8,
          overflow: 'hidden',
          background: media?.url ? '#000' : '#FAF6F0',
          cursor: uploading ? 'wait' : 'default',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) upload(f, 'media')
        }}
      >
        {media?.url ? (
          <>
            {media.type === 'video' ? (
              <video
                key={media.url}
                src={media.url}
                poster={media.posterUrl}
                muted
                playsInline
                controls
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration
                  if (Number.isFinite(d)) onDuration(Math.round(d))
                }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: video?.objectPosition }}
              />
            ) : (
              <img src={media.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <button
              type="button"
              onClick={() => { onChange(undefined); onDuration(undefined) }}
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
            {mode === 'video' ? <VideoIcon size={24} color="#C5B99A" /> : <ImageIcon size={24} color="#C5B99A" />}
            <span style={{ fontSize: '0.75rem', color: '#6B6560', textAlign: 'center' }}>
              Drop {mode} or click to upload
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
        <button type="button" disabled={uploading} onClick={() => mediaInput.current?.click()} style={smallBtn(uploading)}>
          <Upload size={11} /> Upload file
        </button>
        <button type="button" disabled={uploading} onClick={() => onBrowse('media')} style={smallBtn(uploading)}>
          Browse library
        </button>
      </div>
      <input
        ref={mediaInput}
        type="file"
        accept={mode === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, 'media'); e.target.value = '' }}
      />

      {mode === 'video' && (
        <fieldset
          disabled={!hasVideo}
          style={{
            minWidth: 0, margin: '12px 0 0', padding: 12, border: '1px solid #E5DDD0', borderRadius: 8, background: '#FAF6F0',
            display: 'flex', flexDirection: 'column', gap: 10, opacity: hasVideo ? 1 : 0.55,
          }}
        >
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Video settings{duration !== undefined ? ` · ${formatDuration(duration)}` : ''}
          </p>
          {!hasVideo && (
            <p style={{ fontSize: '0.72rem', color: '#6B6560' }}>Upload or pick a video to edit these settings.</p>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={video.autoplay} onChange={(e) => patchVideo({ autoplay: e.target.checked })} />
              Autoplay
            </label>
            <label style={{ fontSize: '0.8rem', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={video.loop} onChange={(e) => patchVideo({ loop: e.target.checked })} />
              Loop
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Start (seconds)</label>
              <input
                type="number" min={0} step={0.1} style={inputStyle} value={start ?? ''}
                placeholder="0"
                onChange={(e) => patchVideo({ startTime: numberOrUndefined(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>End (seconds)</label>
              <input
                type="number" min={0} step={0.1} style={inputStyle} value={end ?? ''}
                placeholder={duration !== undefined ? String(duration) : 'End of video'}
                onChange={(e) => patchVideo({ endTime: numberOrUndefined(e.target.value) })}
              />
            </div>
          </div>
          {rangeInvalid && (
            <p style={{ fontSize: '0.72rem', color: '#B42318' }}>
              End must be greater than start and within the video length{duration !== undefined ? ` (${duration}s)` : ''}.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Speed ({video.playbackRate}x)</label>
              <input
                type="range" min={0.5} max={2} step={0.25} value={video.playbackRate} style={{ width: '100%' }}
                onChange={(e) => patchVideo({ playbackRate: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>Focal position</label>
              <select style={inputStyle} value={video.objectPosition} onChange={(e) => patchVideo({ objectPosition: e.target.value })}>
                {['center', 'top', 'bottom', 'left', 'right'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Sound</label>
            <select style={inputStyle} value={video.audio} onChange={(e) => patchVideo({ audio: e.target.value as HeroVideoAudio })}>
              {AUDIO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.68rem', color: '#6B6560', marginTop: 4 }}>
              Browsers block autoplay with sound until the visitor interacts; the video then plays muted with an unmute button.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Fallback image (poster)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {media?.posterUrl ? (
                <div style={{ position: 'relative', width: 64, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={media.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => media && onChange({ ...media, posterUrl: undefined })}
                    style={{ position: 'absolute', top: 1, right: 1, background: 'rgba(18,14,10,0.7)', border: 'none', borderRadius: 3, color: '#fff', width: 14, height: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={9} />
                  </button>
                </div>
              ) : null}
              <button type="button" disabled={uploading} onClick={() => posterInput.current?.click()} style={smallBtn(uploading)}>
                <Upload size={11} /> Upload
              </button>
              <button type="button" disabled={uploading} onClick={() => onBrowse('poster')} style={smallBtn(uploading)}>
                Browse library
              </button>
            </div>
            <p style={{ fontSize: '0.68rem', color: '#6B6560', marginTop: 4 }}>
              Shown while the video loads, if it fails, with data saver, or for visitors who prefer reduced motion.
            </p>
            <input
              ref={posterInput}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, 'poster'); e.target.value = '' }}
            />
          </div>
        </fieldset>
      )}
    </div>
  )
}

/** Desktop + mobile hero background slots; each one can be an image or a video. */
export function HeroMediaPair({ desktopMedia, mobileMedia, onChange }: Props) {
  const [picker, setPicker] = useState<PickerTarget>(null)
  const [durations, setDurations] = useState<{ desktop?: number; mobile?: number }>({})

  function setSlot(slot: Slot, media: HeroMedia | undefined) {
    if (slot === 'desktop') onChange(media, mobileMedia)
    else onChange(desktopMedia, media)
  }

  function handlePick(url: string) {
    if (!picker) return
    const { slot, purpose } = picker
    const current = slot === 'desktop' ? desktopMedia : mobileMedia
    if (purpose === 'poster') {
      if (current) setSlot(slot, { ...current, posterUrl: url })
    } else if (isVideoUrl(url)) {
      setSlot(slot, {
        type: 'video',
        url,
        posterUrl: current?.posterUrl,
        video: { ...DEFAULT_HERO_VIDEO_SETTINGS, ...current?.video, startTime: undefined, endTime: undefined },
      })
    } else {
      setSlot(slot, { type: 'image', url })
    }
    setPicker(null)
  }

  const pickerSlotMedia = picker ? (picker.slot === 'desktop' ? desktopMedia : mobileMedia) : undefined
  // The picker offers videos only when the slot is (or is about to become) a video slot.
  const allowVideo = picker?.purpose === 'media' && pickerSlotMedia?.type === 'video'

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
        <MediaZone
          label="Desktop"
          slot="desktop"
          media={desktopMedia}
          aspectStyle={{ aspectRatio: '16/9' }}
          onChange={(m) => setSlot('desktop', m)}
          onBrowse={(purpose) => setPicker({ slot: 'desktop', purpose })}
          duration={durations.desktop}
          onDuration={(d) => setDurations((s) => ({ ...s, desktop: d }))}
        />
        <MediaZone
          label="Mobile"
          slot="mobile"
          media={mobileMedia}
          aspectStyle={{ aspectRatio: '9/16', maxHeight: 240 }}
          onChange={(m) => setSlot('mobile', m)}
          onBrowse={(purpose) => setPicker({ slot: 'mobile', purpose })}
          duration={durations.mobile}
          onDuration={(d) => setDurations((s) => ({ ...s, mobile: d }))}
        />
      </div>

      <MediaPickerModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={handlePick}
        allowVideo={allowVideo}
      />
    </>
  )
}
