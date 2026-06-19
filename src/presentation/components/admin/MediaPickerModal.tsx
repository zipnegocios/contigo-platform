'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Film, Check, Loader2 } from 'lucide-react'
import { DndContext } from '@dnd-kit/core'
import {
  MediaLibraryProvider,
  useMediaLibrary,
  type EntityContext,
  type MediaObject,
} from './MediaLibraryContext'
import { MediaSearchBar } from './MediaSearchBar'
import { MediaBankSidebar } from './MediaBankSidebar'

interface MediaPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (publicUrl: string) => void
  onMultiSelect?: (publicUrls: string[]) => void
  multiSelect?: boolean
  allowVideo?: boolean
  entityContext?: EntityContext | null
}

const PICKER_TABS = [
  { key: 'all' as const, label: 'All' },
  { key: 'projects' as const, label: 'Projects' },
  { key: 'services' as const, label: 'Services' },
  { key: 'unassigned' as const, label: 'Unassigned' },
  { key: 'bank' as const, label: 'Bank' },
]

const ASSOC_FIELDS: Record<string, string> = {
  cover: 'Cover', gallery: 'Gallery', poster: 'Poster', image: 'Image',
}

// ─── PickerGrid ───────────────────────────────────────────────────────────────

interface PickerGridProps {
  items: MediaObject[]
  multiSelect: boolean
  selectedUrls: string[]
  entityContext: EntityContext | null
  onItemClick: (item: MediaObject) => void
}

function PickerGrid({ items, multiSelect, selectedUrls, entityContext, onItemClick }: PickerGridProps) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
      {items.map((item) => {
        const isSelected = selectedUrls.includes(item.publicUrl)
        const isOwn = !!entityContext && (item.usedIn ?? []).some(
          (a) => a.entityType === entityContext.type && a.title === entityContext.name
        )
        const firstAssoc = (item.usedIn ?? []).find((a) => !(isOwn && a.title === entityContext?.name))

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onItemClick(item)}
            className="group relative rounded-xl overflow-hidden text-left transition-all duration-150"
            style={{
              aspectRatio: '4/3',
              backgroundColor: 'var(--petrol-800)',
              border: isSelected ? '2px solid var(--contigo-primary)' : '1px solid rgba(226,192,99,0.12)',
              outline: 'none',
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.outline = '2px solid rgba(226,192,99,0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.outline = 'none' }}
          >
            {item.mediaType === 'video' ? (
              <video
                src={item.publicUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                style={{ pointerEvents: 'none' }}
              />
            ) : item.mediaType === 'image' ? (
              <img
                src={item.publicUrl}
                alt={item.key}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <Film className="w-[clamp(1.25rem,2.5vw,1.5rem)] h-[clamp(1.25rem,2.5vw,1.5rem)]" style={{ color: 'var(--neutral-600)' }} />
                <span className="text-[8px] uppercase tracking-wider" style={{ color: '#6B6560' }}>File</span>
              </div>
            )}

            {item.mediaType === 'video' && (
              <span
                className="absolute bottom-7 right-1.5 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(226,192,99,0.2)', color: 'var(--contigo-primary)' }}
              >
                Video
              </span>
            )}

            {multiSelect && (
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150"
                style={{
                  backgroundColor: isSelected ? 'var(--contigo-primary)' : 'rgba(30,26,22,0.6)',
                  border: isSelected ? 'none' : '1.5px solid rgba(226,192,99,0.5)',
                }}
              >
                {isSelected && <Check className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" strokeWidth={3} style={{ color: 'var(--petrol-800)' }} />}
              </div>
            )}

            {isOwn ? (
              <div
                className="absolute top-0 left-0 right-0 px-2 py-0.5 flex items-center gap-1"
                style={{ backgroundColor: 'rgba(82,183,136,0.22)' }}
              >
                <Check className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" strokeWidth={3} style={{ color: '#52B788', flexShrink: 0 }} />
                <span className="text-[9px] truncate" style={{ color: '#52B788' }}>Already assigned</span>
              </div>
            ) : firstAssoc ? (
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full flex items-center gap-1"
                style={{ backgroundColor: 'rgba(226,192,99,0.22)', border: '1px solid rgba(226,192,99,0.35)' }}
              >
                <span className="text-[8px] truncate max-w-[90px]" style={{ color: 'var(--contigo-primary)' }}>
                  {ASSOC_FIELDS[firstAssoc.field] ?? firstAssoc.field}
                </span>
                {(item.usedIn ?? []).length > 1 && (
                  <span className="text-[8px]" style={{ color: 'var(--contigo-primary)' }}>
                    +{(item.usedIn ?? []).length - 1}
                  </span>
                )}
              </div>
            ) : null}

            <div
              className="absolute bottom-0 left-0 right-0 px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
              style={{ backgroundColor: 'rgba(30,26,22,0.88)' }}
            >
              <p className="text-[10px] truncate" style={{ color: 'var(--neutral-50)' }}>
                {item.key.split('/').pop()}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── PickerShell ──────────────────────────────────────────────────────────────

interface PickerShellProps {
  onSelect: (url: string) => void
  onMultiSelect?: (urls: string[]) => void
  onClose: () => void
  multiSelect: boolean
  allowVideo: boolean
}

function PickerShell({ onSelect, onMultiSelect, onClose, multiSelect, allowVideo }: PickerShellProps) {
  const { filteredItems, tab, setTab, loading, entityContext } = useMediaLibrary()
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

  const visibleItems = allowVideo
    ? filteredItems
    : filteredItems.filter((i) => i.mediaType !== 'video')

  const toggleUrl = (url: string) =>
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )

  const handleItemClick = (item: MediaObject) => {
    if (multiSelect) {
      toggleUrl(item.publicUrl)
    } else {
      onSelect(item.publicUrl)
      onClose()
    }
  }

  return (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #E5DDD0' }}
      >
        <h2
          className="text-fluid-xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}
        >
          {multiSelect ? 'Select Media' : 'Media Library'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 min-h-[44px] min-w-[44px]"
          style={{ color: 'var(--neutral-600)' }}
        >
          <X className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        <MediaSearchBar />
      </div>

      {/* Tabs */}
      <div className="px-6 pb-2 flex-shrink-0">
        <div className="flex gap-1 flex-wrap">
          {PICKER_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="px-4 py-1.5 rounded-lg text-fluid-sm font-medium transition-all duration-150 min-h-[44px]"
              style={
                tab === t.key
                  ? { backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }
                  : { color: '#6B6560' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-4 flex-1 overflow-hidden px-6 pb-2">
        {tab === 'bank' && (
          <DndContext>
            <MediaBankSidebar />
          </DndContext>
        )}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-[clamp(1.5rem,3vw,1.75rem)] h-[clamp(1.5rem,3vw,1.75rem)] animate-spin" style={{ color: 'var(--contigo-primary)' }} />
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                No media found in this section.
              </p>
            </div>
          ) : (
            <PickerGrid
              items={visibleItems}
              multiSelect={multiSelect}
              selectedUrls={selectedUrls}
              entityContext={entityContext}
              onItemClick={handleItemClick}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: '1px solid #E5DDD0' }}
      >
        {multiSelect ? (
          <>
            <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
              {selectedUrls.length > 0
                ? `${selectedUrls.length} item${selectedUrls.length !== 1 ? 's' : ''} selected`
                : 'Click images to select'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-fluid-sm px-4 py-1.5 rounded-lg min-h-[44px]"
                style={{ color: '#6B6560' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { if (onMultiSelect) onMultiSelect(selectedUrls); onClose() }}
                disabled={selectedUrls.length === 0}
                className="text-fluid-sm px-5 py-1.5 rounded-lg font-semibold disabled:opacity-40 min-h-[44px]"
                style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
              >
                Add {selectedUrls.length > 0 ? `${selectedUrls.length} ` : ''}to gallery
              </button>
            </div>
          </>
        ) : (
          <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
            {visibleItems.length} file{visibleItems.length !== 1 ? 's' : ''} — click any to select
          </p>
        )}
      </div>
    </>
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  onMultiSelect,
  multiSelect = false,
  allowVideo = false,
  entityContext = null,
}: MediaPickerModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(30,26,22,0.72)' }}
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 960,
          maxHeight: '88vh',
          backgroundColor: 'var(--neutral-50)',
          border: '1px solid rgba(226,192,99,0.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <MediaLibraryProvider entityContext={entityContext}>
          <PickerShell
            onSelect={onSelect}
            onMultiSelect={onMultiSelect}
            onClose={onClose}
            multiSelect={multiSelect}
            allowVideo={allowVideo}
          />
        </MediaLibraryProvider>
      </div>
    </div>,
    document.body
  )
}
