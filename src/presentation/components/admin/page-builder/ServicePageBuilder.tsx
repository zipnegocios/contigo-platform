'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, Save, ExternalLink, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_DEFAULTS, BLOCK_LABELS } from '@/types/pageBlocks'
import { BlockList } from './BlockList'
import { BlockEditorPanel } from './BlockEditorPanel'
import { PreviewPageWrapper } from './PreviewPageWrapper'
import { PageBlockRenderer } from '@/presentation/components/PageBlockRenderer'

// ─── Block type metadata ─────────────────────────────────────────────────────

const BLOCK_ICONS: Record<PageBlock['type'], string> = {
  'hero':             '🖼',
  'rich-text':        '📝',
  'gallery':          '🗃',
  'process':          '📋',
  'two-column':       '⬛',
  'features-grid':    '⊞',
  'cta':              '🔲',
  'image-carousel':   '🎠',
  'comparison-cards': '⚖',
  'whatsapp-cta':     '💬',
  'custom':           '</>',
}

const ALL_BLOCK_TYPES: PageBlock['type'][] = [
  'hero', 'rich-text', 'gallery', 'process', 'two-column',
  'features-grid', 'cta', 'image-carousel', 'comparison-cards',
  'whatsapp-cta', 'custom',
]

// ─── Props ───────────────────────────────────────────────────────────────────

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

// ─── Elements panel ──────────────────────────────────────────────────────────

function ElementsPanel({ onAdd }: { onAdd: (type: PageBlock['type']) => void }) {
  const [search, setSearch] = useState('')
  const filtered = ALL_BLOCK_TYPES.filter((t) =>
    BLOCK_LABELS[t].toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search elements..."
          className="w-full rounded-md px-3 py-2 text-fluid-xs outline-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((type) => (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg text-center transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(226,192,99,0.15)'
                e.currentTarget.style.borderColor = 'rgba(226,192,99,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              <span
                className="leading-none"
                style={
                  type === 'custom'
                    ? { fontFamily: 'monospace', fontSize: '0.85rem', color: '#E2C063', fontWeight: 700 }
                    : { fontSize: '1.25rem' }
                }
              >
                {BLOCK_ICONS[type]}
              </span>
              <span className="text-fluid-xs font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {BLOCK_LABELS[type]}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center py-8 text-fluid-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No elements found
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ServicePageBuilder({ service, categorySlug }: ServicePageBuilderProps) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<PageBlock[]>(() => initBlocks(service))
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [published, setPublished] = useState(service.published)
  const [saving, setSaving] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelTab, setPanelTab] = useState<'elements' | 'blocks'>('elements')

  const activeBlock = blocks.find((b) => b.id === activeBlockId) ?? null
  const visitUrl = `/services/${categorySlug}/${service.slug}`

  // ── Block operations ──────────────────────────────────────────────────────

  const addBlock = useCallback((type: PageBlock['type']) => {
    const newBlock: PageBlock = {
      id: crypto.randomUUID(),
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: BLOCK_DEFAULTS[type] as any,
    }
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
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#F5EFE8' }}>

      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #E5DDD0',
          minHeight: '52px',
          zIndex: 10,
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="p-1.5 rounded-md transition-all"
            style={{ color: '#6B6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            title={panelOpen ? 'Close panel' : 'Open panel'}
          >
            {panelOpen
              ? <PanelLeftClose className="w-4 h-4" />
              : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <Link
            href="/admin/services"
            className="flex items-center gap-1 text-fluid-sm transition-opacity hover:opacity-70"
            style={{ color: '#6B6560' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Services
          </Link>
          <span style={{ color: '#C5BDB5' }}>›</span>
          <span className="text-fluid-sm font-medium" style={{ color: '#2D2924' }}>{service.name}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <a
            href={visitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-fluid-xs font-medium transition-all"
            style={{ border: '1px solid #E5DDD0', color: '#6B6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5EFE8' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit Page
          </a>

          <button
            onClick={togglePublished}
            className="px-3 py-1.5 rounded-full text-fluid-xs font-medium transition-all"
            style={published
              ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d', border: '1px solid rgba(34,197,94,0.3)' }
              : { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560', border: '1px solid #E5DDD0' }}
          >
            {published ? 'Published' : 'Draft'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-fluid-xs font-semibold min-h-[34px] transition-all"
            style={{
              backgroundColor: saving ? '#C8A55C' : '#E2C063',
              color: '#1E1A16',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ── */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: panelOpen ? '380px' : '0',
            transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
            backgroundColor: '#1E1A16',
          }}
        >
          {/* Panel tabs */}
          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: '42px' }}
          >
            {(['elements', 'blocks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                className="flex-1 text-fluid-xs font-semibold transition-all"
                style={{
                  color: panelTab === tab ? '#E2C063' : 'rgba(255,255,255,0.45)',
                  borderBottom: panelTab === tab ? '2px solid #E2C063' : '2px solid transparent',
                  backgroundColor: 'transparent',
                }}
              >
                {tab === 'elements' ? 'Elements' : 'Blocks'}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {panelTab === 'elements' && (
              <ElementsPanel onAdd={addBlock} />
            )}

            {panelTab === 'blocks' && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Block count header */}
                <div
                  className="px-4 py-2 flex-shrink-0 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-fluid-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
                  </span>
                  <button
                    onClick={() => setPanelTab('elements')}
                    className="text-fluid-xs px-2 py-1 rounded transition-all"
                    style={{ color: '#E2C063', border: '1px solid rgba(226,192,99,0.3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,192,99,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    + Add
                  </button>
                </div>

                {/* Block list — dark-themed wrapper */}
                <div
                  className="overflow-y-auto"
                  style={{
                    maxHeight: activeBlock ? '200px' : undefined,
                    flex: activeBlock ? 'none' : '1',
                    backgroundColor: '#1E1A16',
                  }}
                >
                  <style>{`
                    .dark-block-list li { border-color: rgba(255,255,255,0.06) !important; }
                    .dark-block-list li > span { color: rgba(255,255,255,0.85) !important; }
                    .dark-block-list li button { color: rgba(255,255,255,0.4) !important; }
                  `}</style>
                  <div className="dark-block-list">
                    <BlockList
                      blocks={blocks}
                      activeBlockId={activeBlockId}
                      onSelect={setActiveBlockId}
                      onDelete={deleteBlock}
                      onReorder={reorderBlocks}
                    />
                  </div>
                </div>

                {/* Editor for selected block */}
                {activeBlock && (
                  <div
                    className="flex-1 overflow-y-auto flex flex-col"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#262220' }}
                  >
                    <div
                      className="px-4 py-2.5 flex-shrink-0 flex items-center justify-between"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <span className="text-fluid-xs font-semibold" style={{ color: '#E2C063' }}>
                        {BLOCK_LABELS[activeBlock.type]}
                      </span>
                      <button
                        onClick={() => setActiveBlockId(null)}
                        className="text-fluid-xs px-1.5 py-0.5 rounded transition-colors"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      <style>{`
                        /* Hide BlockEditorPanel's built-in "Editing: X" header — we show our own */
                        .dark-editor > div > div:first-child { display: none !important; }
                        .dark-editor > div { border-top: none !important; }
                        .dark-editor label { color: rgba(255,255,255,0.7) !important; }
                        .dark-editor input:not([type="range"]), .dark-editor select {
                          background: rgba(255,255,255,0.07) !important;
                          color: rgba(255,255,255,0.9) !important;
                          border-color: rgba(255,255,255,0.15) !important;
                        }
                        .dark-editor input::placeholder { color: rgba(255,255,255,0.3) !important; }
                        .dark-editor textarea:not(.code-editor) {
                          background: rgba(255,255,255,0.07) !important;
                          color: rgba(255,255,255,0.9) !important;
                          border-color: rgba(255,255,255,0.15) !important;
                        }
                        .dark-editor textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
                        .dark-editor span { color: rgba(255,255,255,0.6) !important; }
                      `}</style>
                      <div className="dark-editor">
                        <BlockEditorPanel
                          block={activeBlock}
                          onChange={(data) => updateBlock(activeBlock.id, data)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Canvas ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: '#DDD8D0' }}
        >
          <div
            className="mx-auto bg-white"
            style={{ minHeight: '100%', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.12)' }}
          >
            {blocks.length === 0 ? (
              <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                  <p className="text-fluid-2xl mb-2" style={{ color: '#9C8F83' }}>∅</p>
                  <p className="text-fluid-sm" style={{ color: '#9C8F83' }}>
                    No blocks yet — add one from the Elements panel.
                  </p>
                </div>
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
  )
}
