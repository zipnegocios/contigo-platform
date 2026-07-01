'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, Save } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_DEFAULTS } from '@/types/pageBlocks'
import { BlockList } from './BlockList'
import { BlockPicker } from './BlockPicker'
import { BlockEditorPanel } from './BlockEditorPanel'
import { PageBlockRenderer } from '@/presentation/components/PageBlockRenderer'

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
  // Pre-populate Hero block on first open
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

export function ServicePageBuilder({ service, categorySlug: _categorySlug }: ServicePageBuilderProps) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<PageBlock[]>(() => initBlocks(service))
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [published, setPublished] = useState(service.published)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const activeBlock = blocks.find((b) => b.id === activeBlockId) ?? null

  const addBlock = useCallback((type: PageBlock['type']) => {
    const newBlock: PageBlock = {
      id: crypto.randomUUID(),
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: BLOCK_DEFAULTS[type] as any,
    }
    setBlocks((prev) => [...prev, newBlock])
    setActiveBlockId(newBlock.id)
    setShowPicker(false)
  }, [])

  const updateBlock = useCallback((id: string, data: PageBlock['data']) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data } as PageBlock : b))
    )
  }, [])

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    setActiveBlockId((cur) => (cur === id ? null : cur))
  }, [])

  const reorderBlocks = useCallback((reordered: PageBlock[]) => {
    setBlocks(reordered)
  }, [])

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
    } catch {
      setPublished(!next) // revert
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #E5DDD0', backgroundColor: 'white', minHeight: '56px' }}
      >
        <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-fluid-sm font-semibold min-h-[36px] transition-all"
            style={{ backgroundColor: saving ? '#C8A55C' : '#E2C063', color: '#1E1A16', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* Body: split-pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div
          className="flex flex-col flex-shrink-0 overflow-y-auto"
          style={{ width: '420px', borderRight: '1px solid #E5DDD0', backgroundColor: 'white' }}
        >
          {/* Add Block button */}
          <div className="p-4 relative" style={{ borderBottom: '1px solid #F5EFE8' }}>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="w-full py-2.5 rounded-lg text-fluid-sm font-semibold transition-all"
              style={{ border: '1.5px dashed #E2C063', color: '#A07B2A', backgroundColor: 'rgba(226,192,99,0.06)' }}
            >
              + Add Block
            </button>
            {showPicker && (
              <BlockPicker onSelect={addBlock} onClose={() => setShowPicker(false)} />
            )}
          </div>

          {/* Block list */}
          <BlockList
            blocks={blocks}
            activeBlockId={activeBlockId}
            onSelect={setActiveBlockId}
            onDelete={deleteBlock}
            onReorder={reorderBlocks}
          />

          {/* Editor panel */}
          {activeBlock && (
            <BlockEditorPanel
              block={activeBlock}
              onChange={(data) => updateBlock(activeBlock.id, data)}
            />
          )}
        </div>

        {/* Right pane — preview */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F5EFE8' }}>
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-fluid-sm" style={{ color: '#9C8F83' }}>
                Add a block to start building your page.
              </p>
            </div>
          ) : (
            <div className="bg-white min-h-full">
              <PageBlockRenderer blocks={blocks} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
