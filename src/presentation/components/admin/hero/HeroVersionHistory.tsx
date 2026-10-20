'use client'

import { useCallback, useEffect, useState } from 'react'
import { Archive, ArchiveRestore, History, Loader2, RotateCcw, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { legacyImageUrl, resolveHeroMedia, type HeroConfig, type HeroConfigInput } from '@/core/entities/HeroConfig'
import { MAX_RECENT_HERO_VERSIONS, type HeroConfigVersion } from '@/core/entities/HeroConfigVersion'

interface Props {
  currentConfig: HeroConfigInput
  /** Bump to reload the list after a version is created elsewhere (e.g. the sticky bar). */
  refreshKey?: number
  onRestored: (config: HeroConfig) => void
}

// Dates arrive as ISO strings over JSON.
type VersionDTO = Omit<HeroConfigVersion, 'createdAt' | 'archivedAt'> & { createdAt: string; archivedAt?: string | null }

const API = '/api/admin/hero-config/versions'

const btn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 10px',
  borderRadius: 6, border: '1px solid #E5DDD0', background: '#fff', color: '#2D2924', cursor: 'pointer',
}

function describe(snapshot: HeroConfigInput): string {
  const media = [
    resolveHeroMedia(snapshot.desktopMedia, snapshot.desktopImageUrl),
    resolveHeroMedia(snapshot.mobileMedia, snapshot.mobileImageUrl),
  ]
  const hasVideo = snapshot.mode === 'slider'
    ? snapshot.slides.some((s) => s.desktopMedia?.type === 'video' || s.mobileMedia?.type === 'video')
    : media.some((m) => m?.type === 'video')
  const kind = snapshot.mode === 'slider' ? `Slider · ${snapshot.slides.length} slides` : 'Single'
  return `${kind}${hasVideo ? ' · video' : ''}`
}

function thumb(snapshot: HeroConfigInput): string | undefined {
  if (snapshot.mode === 'slider') {
    const s = snapshot.slides[0]
    return s ? s.desktopImageUrl || legacyImageUrl(s.desktopMedia) : undefined
  }
  return snapshot.desktopImageUrl || legacyImageUrl(snapshot.desktopMedia)
}

export function HeroVersionHistory({ currentConfig, refreshKey, onRestored }: Props) {
  const [versions, setVersions] = useState<VersionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [tab, setTab] = useState<'recent' | 'archived'>('recent')
  const [label, setLabel] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(API)
      const json = await res.json()
      if (res.ok) setVersions(json.versions)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  async function call(key: string, url: string, init: RequestInit, success: string, after?: (json: any) => void) {
    setBusy(key)
    try {
      const res = await fetch(url, init)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Request failed')
        return
      }
      if (json.versions) setVersions(json.versions)
      after?.(json)
      toast.success(success)
    } catch {
      toast.error('Request failed')
    } finally {
      setBusy(null)
    }
  }

  const recent = versions.filter((v) => !v.archivedAt)
  const archived = versions.filter((v) => v.archivedAt)
  const shown = tab === 'recent' ? recent : archived

  return (
    <div id="hero-version-history" style={{ background: '#fff', border: '1px solid #E5DDD0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6560', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        <History size={14} /> Version history
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Version name (optional)"
          maxLength={120}
          style={{ flex: '1 1 220px', padding: '7px 10px', border: '1px solid #E5DDD0', borderRadius: 6, fontSize: '0.8rem' }}
        />
        <button
          disabled={busy !== null}
          onClick={() =>
            call('create', API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ label: label || undefined, config: currentConfig }),
            }, 'Version saved', () => setLabel(''))
          }
          style={{ ...btn, background: '#E2C063', border: 'none', fontWeight: 600, padding: '7px 14px' }}
        >
          {busy === 'create' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
          Save as version
        </button>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#6B6560', marginBottom: 12 }}>
        Saves what is currently in the editor (including unsaved edits) without publishing it. The last {MAX_RECENT_HERO_VERSIONS} recent versions are kept; archive one to keep it permanently.
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {([['recent', `Recent (${recent.length}/${MAX_RECENT_HERO_VERSIONS})`], ['archived', `Archived (${archived.length})`]] as const).map(([key, text]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ ...btn, background: tab === key ? '#2D2924' : '#fff', color: tab === key ? '#FAF6F0' : '#2D2924', fontWeight: 600 }}
          >
            {text}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: '0.8rem', color: '#6B6560' }}>Loading…</p>
      ) : shown.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: '#6B6560' }}>
          {tab === 'recent' ? 'No versions yet.' : 'No archived versions.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((v) => {
            const img = thumb(v.snapshot)
            const disabled = busy !== null
            return (
              <li key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid #E5DDD0', borderRadius: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 72, height: 44, borderRadius: 4, background: '#EFE8DA', overflow: 'hidden', flexShrink: 0 }}>
                  {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2D2924', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.label}</p>
                  <p style={{ fontSize: '0.72rem', color: '#6B6560' }}>
                    {new Date(v.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })} · {describe(v.snapshot)}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#6B6560', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.snapshot.headline.replace(/\s+/g, ' ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={disabled}
                    onClick={() => {
                      if (!window.confirm(`Publish "${v.label}"? The current hero is saved to the history first.`)) return
                      call(`restore:${v.id}`, `${API}/${v.id}/restore`, { method: 'POST' }, 'Version restored and published', (json) => onRestored(json.config))
                    }}
                    style={btn}
                  >
                    {busy === `restore:${v.id}` ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={12} />} Restore
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() =>
                      call(`archive:${v.id}`, `${API}/${v.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ archived: !v.archivedAt }),
                      }, v.archivedAt ? 'Version unarchived' : 'Version archived')
                    }
                    style={btn}
                  >
                    {v.archivedAt ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                    {v.archivedAt ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() => {
                      if (!window.confirm(`Delete "${v.label}" permanently?`)) return
                      call(`delete:${v.id}`, `${API}/${v.id}`, { method: 'DELETE' }, 'Version deleted')
                    }}
                    style={{ ...btn, color: '#B42318' }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
