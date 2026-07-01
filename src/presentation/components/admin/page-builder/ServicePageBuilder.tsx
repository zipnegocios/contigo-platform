'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronLeft, Save, ExternalLink, Search, Loader2, X,
  Monitor, Tablet, Smartphone, Plus,
} from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_DEFAULTS, BLOCK_LABELS } from '@/types/pageBlocks'
import { BLOCK_ICONS, ELEMENT_CATEGORIES } from './blockMeta'
import { BlockList } from './BlockList'
import { BlockEditorPanel } from './BlockEditorPanel'
import { PreviewPageWrapper } from './PreviewPageWrapper'
import { PageBlockRenderer } from '@/presentation/components/PageBlockRenderer'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeviceWidth = 'full' | 'tablet' | 'mobile'
type PanelTab = 'elements' | 'blocks'

interface ServicePageBuilderProps {
  service: {
    id: string
    name: string
    shortDescription: string
    imageUrl: string
    published: boolean
    pageBlocks: PageBlock[] | null
    categoryId: string | null
    slug: string
  }
  categorySlug: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initBlocks(service: ServicePageBuilderProps['service']): PageBlock[] {
  if (service.pageBlocks && service.pageBlocks.length > 0) return service.pageBlocks
  return [{
    id: crypto.randomUUID(),
    type: 'hero',
    data: {
      imageUrl: service.imageUrl,
      title: service.name,
      subtitle: service.shortDescription,
      overlayOpacity: 40,
    },
  }]
}

const DEVICE_CONFIG: { id: DeviceWidth; label: string; maxWidth: string | undefined }[] = [
  { id: 'full',   label: 'Desktop',    maxWidth: undefined },
  { id: 'tablet', label: '768px',      maxWidth: '768px' },
  { id: 'mobile', label: '390px',      maxWidth: '390px' },
]

// ─── Elements panel ──────────────────────────────────────────────────────────

function ElementsPanel({ onAdd }: { onAdd: (type: PageBlock['type']) => void }) {
  const [search, setSearch] = useState('')

  const categories = ELEMENT_CATEGORIES.map((cat) => ({
    ...cat,
    types: cat.types.filter((t) =>
      BLOCK_LABELS[t].toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.types.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search input */}
      <div style={{ padding: '10px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.28)', pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search elements…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: search ? 28 : 10,
              paddingTop: 7, paddingBottom: 7, borderRadius: 7,
              fontSize: '0.73rem', outline: 'none', boxSizing: 'border-box',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                color: 'rgba(255,255,255,0.35)', display: 'flex',
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Category list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {categories.map((cat) => (
          <div key={cat.label}>
            <p style={{
              padding: '14px 14px 5px',
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            }}>
              {cat.label}
            </p>
            {cat.types.map((type) => {
              const Icon = BLOCK_ICONS[type]
              return (
                <button
                  key={type}
                  onClick={() => onAdd(type)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: '8px 14px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,192,99,0.07)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span style={{
                    width: 28, height: 28, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)',
                  }}>
                    <Icon size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
                    {BLOCK_LABELS[type]}
                  </span>
                </button>
              )
            })}
          </div>
        ))}

        {categories.length === 0 && (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
              Nothing matches &ldquo;{search}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function ServicePageBuilder({ service, categorySlug }: ServicePageBuilderProps) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<PageBlock[]>(() => initBlocks(service))
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [published, setPublished] = useState(service.published)
  const [saving, setSaving] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelTab, setPanelTab] = useState<PanelTab>('elements')
  const [deviceWidth, setDeviceWidth] = useState<DeviceWidth>('full')

  const activeBlock = blocks.find((b) => b.id === activeBlockId) ?? null
  const ActiveBlockIcon = activeBlock ? BLOCK_ICONS[activeBlock.type] : null
  const visitUrl = `/services/${categorySlug}/${service.slug}`
  const canvasMaxWidth = DEVICE_CONFIG.find((d) => d.id === deviceWidth)?.maxWidth

  // ── Block operations ──────────────────────────────────────────────────────

  const addBlock = useCallback((type: PageBlock['type']) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type,
      data: BLOCK_DEFAULTS[type],
    } as PageBlock
    setBlocks((prev) => [...prev, newBlock])
    setActiveBlockId(newBlock.id)
    setPanelTab('blocks')
  }, [])

  const updateBlock = useCallback((id: string, data: PageBlock['data']) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } as PageBlock : b)))
  }, [])

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    setActiveBlockId((cur) => (cur === id ? null : cur))
  }, [])

  const reorderBlocks = useCallback((reordered: PageBlock[]) => {
    setBlocks(reordered)
  }, [])

  // ── Persistence ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageBlocks: blocks, published }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Page saved')
      router.refresh()
    } catch {
      toast.error('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async () => {
    const next = !published
    setPublished(next)
    try {
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      })
      toast.success(next ? 'Published' : 'Set to Draft')
    } catch {
      setPublished(!next)
      toast.error('Failed to update status')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#161210' }}>

      {/* ── Top bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px 0 16px', flexShrink: 0, height: 50,
        backgroundColor: '#1C1916', borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 20,
      }}>

        {/* Left: breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Link
            href="/admin/services"
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)',
              textDecoration: 'none', flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.38)' }}
          >
            <ChevronLeft size={13} />
            Services
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.72rem' }}>/</span>
          <span style={{
            fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.82)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
          }}>
            {service.name}
          </span>
          <span style={{
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em',
            padding: '2px 7px', borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase', flexShrink: 0,
          }}>
            Builder
          </span>
        </div>

        {/* Center: device switcher */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 1,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 8, padding: '3px',
        }}>
          {([
            { id: 'full'   as DeviceWidth, Icon: Monitor,    label: 'Full' },
            { id: 'tablet' as DeviceWidth, Icon: Tablet,     label: '768' },
            { id: 'mobile' as DeviceWidth, Icon: Smartphone, label: '390' },
          ]).map(({ id, Icon, label }) => (
            <button
              key={id}
              title={id === 'full' ? 'Full width' : `${label}px`}
              onClick={() => setDeviceWidth(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6,
                border: 'none', cursor: 'pointer',
                backgroundColor: deviceWidth === id ? 'rgba(255,255,255,0.11)' : 'transparent',
                color: deviceWidth === id ? '#E2C063' : 'rgba(255,255,255,0.38)',
                transition: 'all 140ms ease',
                fontSize: '0.68rem', fontWeight: deviceWidth === id ? 600 : 500,
              }}
              onMouseEnter={(e) => { if (deviceWidth !== id) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              onMouseLeave={(e) => { if (deviceWidth !== id) e.currentTarget.style.color = 'rgba(255,255,255,0.38)' }}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <a
            href={visitUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 7,
              fontSize: '0.72rem', fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none', transition: 'all 140ms',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'rgba(255,255,255,0.22)'
              el.style.color = 'rgba(255,255,255,0.85)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'rgba(255,255,255,0.1)'
              el.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <ExternalLink size={12} />
            Visit
          </a>

          <button
            onClick={togglePublished}
            style={{
              padding: '5px 11px', borderRadius: 7,
              fontSize: '0.72rem', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 140ms',
              ...(published
                ? { backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80' }
                : { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }),
            }}
          >
            {published ? '● Published' : '○ Draft'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 7,
              fontSize: '0.75rem', fontWeight: 700,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              backgroundColor: saving ? 'rgba(226,192,99,0.55)' : '#E2C063',
              color: '#1A1714', transition: 'background 140ms ease',
              letterSpacing: '0.01em',
            }}
          >
            {saving
              ? <Loader2 size={13} style={{ animation: 'pb-spin 0.8s linear infinite' }} />
              : <Save size={13} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left panel ── */}
        <div style={{
          flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          width: panelOpen ? 310 : 0,
          transition: 'width 260ms cubic-bezier(0.4,0,0.2,1)',
          backgroundColor: '#1C1916',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Panel tabs */}
          <div style={{
            display: 'flex', flexShrink: 0, height: 40,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            {(['elements', 'blocks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.01em',
                  backgroundColor: 'transparent',
                  color: panelTab === tab ? '#E2C063' : 'rgba(255,255,255,0.33)',
                  borderBottom: panelTab === tab ? '2px solid #E2C063' : '2px solid transparent',
                  transition: 'all 140ms ease',
                }}
              >
                {tab === 'elements' ? 'Add' : `Page (${blocks.length})`}
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* — Add elements tab */}
            {panelTab === 'elements' && (
              <ElementsPanel onAdd={addBlock} />
            )}

            {/* — Page structure tab */}
            {panelTab === 'blocks' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Structure header */}
                <div style={{
                  padding: '7px 12px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{
                    fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                  }}>
                    Page structure
                  </span>
                  <button
                    onClick={() => setPanelTab('elements')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 5,
                      border: '1px solid rgba(226,192,99,0.22)',
                      background: 'rgba(226,192,99,0.06)',
                      color: '#E2C063', fontSize: '0.68rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'background 130ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,192,99,0.12)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,192,99,0.06)' }}
                  >
                    <Plus size={10} /> Add
                  </button>
                </div>

                {/* Block list */}
                <div style={{
                  overflowY: 'auto',
                  flex: activeBlock ? '0 0 auto' : 1,
                  maxHeight: activeBlock ? '220px' : undefined,
                }}>
                  <BlockList
                    blocks={blocks}
                    activeBlockId={activeBlockId}
                    onSelect={setActiveBlockId}
                    onDelete={deleteBlock}
                    onReorder={reorderBlocks}
                  />
                </div>

                {/* Active block editor */}
                {activeBlock && ActiveBlockIcon && (
                  <div style={{
                    flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    backgroundColor: '#201D1A',
                  }}>
                    {/* Editor header */}
                    <div style={{
                      padding: '9px 12px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 24, height: 24, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 5, backgroundColor: 'rgba(226,192,99,0.14)',
                        }}>
                          <ActiveBlockIcon size={12} style={{ color: '#E2C063' }} />
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#E2C063', letterSpacing: '0.01em' }}>
                          {BLOCK_LABELS[activeBlock.type]}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveBlockId(null)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(255,255,255,0.28)', padding: 4, borderRadius: 4,
                          display: 'flex', alignItems: 'center', transition: 'color 130ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Editor fields */}
                    <div className="pb-dark-editor" style={{ flex: 1, overflowY: 'auto' }}>
                      <BlockEditorPanel
                        block={activeBlock}
                        onChange={(data) => updateBlock(activeBlock.id, data)}
                      />
                    </div>
                  </div>
                )}

                {/* No selection hint */}
                {!activeBlock && blocks.length > 0 && (
                  <div style={{ padding: '1.5rem 14px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.22)', lineHeight: 1.6 }}>
                      Select a block above to edit its content and settings.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Canvas column ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Canvas toolbar */}
          <div style={{
            height: 34, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 14px',
            backgroundColor: '#181513',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <button
              onClick={() => setPanelOpen((v) => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.65rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.28)',
                padding: '3px 8px', borderRadius: 5, transition: 'all 130ms',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.28)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {panelOpen ? '‹ Hide panel' : '› Show panel'}
            </button>

            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums' }}>
              {deviceWidth === 'full' ? 'Full width' : deviceWidth === 'tablet' ? 'Tablet · 768px' : 'Mobile · 390px'}
              {' · '}
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
            </span>
          </div>

          {/* Canvas viewport */}
          <div
            style={{
              flex: 1, overflowY: 'auto',
              backgroundColor: '#1E1B17',
              backgroundImage: deviceWidth !== 'full'
                ? 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)'
                : undefined,
              backgroundSize: '22px 22px',
              padding: deviceWidth !== 'full' ? '28px 16px' : 0,
            }}
          >
            <div
              style={{
                margin: '0 auto',
                width: canvasMaxWidth ?? '100%',
                maxWidth: canvasMaxWidth,
                minHeight: deviceWidth !== 'full' ? '80vh' : '100%',
                backgroundColor: '#fff',
                boxShadow: deviceWidth !== 'full'
                  ? '0 0 0 1px rgba(0,0,0,0.25), 0 12px 48px rgba(0,0,0,0.5)'
                  : 'none',
                borderRadius: deviceWidth !== 'full' ? 4 : 0,
                overflow: 'hidden',
                transition: 'max-width 280ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {blocks.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: '70vh', gap: 14,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    border: '2px dashed rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Plus size={22} style={{ color: 'rgba(0,0,0,0.18)' }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.28)', textAlign: 'center', lineHeight: 1.5 }}>
                    Add your first element<br />from the panel on the left.
                  </p>
                </div>
              ) : (
                <PreviewPageWrapper>
                  <PageBlockRenderer blocks={blocks} />
                </PreviewPageWrapper>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes pb-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

        /* Dark mode overrides for BlockEditorPanel fields */
        .pb-dark-editor > div > div:first-child { display: none !important; }
        .pb-dark-editor > div { border-top: none !important; }
        .pb-dark-editor label {
          color: rgba(255,255,255,0.6) !important;
          font-size: 0.7rem !important;
          font-weight: 500 !important;
        }
        .pb-dark-editor input:not([type="range"]),
        .pb-dark-editor select {
          background: rgba(255,255,255,0.07) !important;
          color: rgba(255,255,255,0.88) !important;
          border-color: rgba(255,255,255,0.11) !important;
        }
        .pb-dark-editor input::placeholder,
        .pb-dark-editor textarea::placeholder {
          color: rgba(255,255,255,0.22) !important;
        }
        .pb-dark-editor textarea:not(.code-editor) {
          background: rgba(255,255,255,0.07) !important;
          color: rgba(255,255,255,0.88) !important;
          border-color: rgba(255,255,255,0.11) !important;
        }
        .pb-dark-editor p.text-fluid-xs,
        .pb-dark-editor span:not([data-keep]) {
          color: rgba(255,255,255,0.5) !important;
        }
        .pb-dark-editor .p-4 { padding: 12px 14px !important; }
        .pb-dark-editor .space-y-4 > * + * { margin-top: 10px !important; }
      `}</style>
    </div>
  )
}
