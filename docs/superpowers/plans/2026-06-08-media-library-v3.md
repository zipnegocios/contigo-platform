# Media Library v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/admin/media` into a fully-featured, Context-driven media management system with DnD folder organization, advanced search, sliding detail drawer, assign-to-entity actions, and clear association display in Browse Library.

**Architecture:** `MediaLibraryContext` centralises all state and mutations; seven focused component files consume it; `MediaLibrary.tsx` becomes a ~120-line orchestrator. DnD uses the already-installed `@dnd-kit/core` (draggable cards → droppable folder rows). No new npm dependencies.

**Tech Stack:** Next.js 15, React 19, TypeScript, `@dnd-kit/core` v6, Tailwind CSS, Contigo design tokens (`#E2C063`, `#1E1A16`, `#FAF6F0`), existing `/api/admin/media/*` routes.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| **Create** | `src/presentation/components/admin/MediaLibraryContext.tsx` | All state, derived filteredItems, all API mutations |
| **Create** | `src/presentation/components/admin/MediaCard.tsx` | Single card — draggable, context-menu-aware, tag chips |
| **Create** | `src/presentation/components/admin/MediaGrid.tsx` | Responsive grid + DnD DragOverlay + ContextMenu |
| **Create** | `src/presentation/components/admin/MediaBankSidebar.tsx` | Folder tree (droppable) + tag panel |
| **Create** | `src/presentation/components/admin/MediaSearchBar.tsx` | Search input + collapsible advanced filters |
| **Create** | `src/presentation/components/admin/MediaDetailDrawer.tsx` | Right-side sliding panel, metadata, org, actions |
| **Create** | `src/presentation/components/admin/AssignToEntityModal.tsx` | Project/service picker for Cover/Gallery assignment |
| **Rewrite** | `src/presentation/components/admin/MediaLibrary.tsx` | ~120-line orchestrator consuming Context |
| **Modify** | `src/presentation/components/admin/MediaPickerModal.tsx` | Association badges, entityContext prop |

---

## Task 1: MediaLibraryContext — state, filters, mutations

**Files:**
- Create: `src/presentation/components/admin/MediaLibraryContext.tsx`

- [ ] **Step 1: Create the Context file**

```typescript
// src/presentation/components/admin/MediaLibraryContext.tsx
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import type { AssociationInfo, MediaFolder, MediaTag, MediaMetadata } from '@/types/media'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaObject {
  key: string
  size: number
  lastModified: string
  publicUrl: string
  mediaType: 'image' | 'video' | 'other'
  usedIn: AssociationInfo[]
  metadata?: MediaMetadata | null
}

export interface AdvancedFilters {
  mediaType: 'all' | 'image' | 'video'
  folderId: string | null
  tagNames: string[]
  associatedWith: { entityType: 'project' | 'service'; title: string } | null
  dateRange: { from: string; to: string } | null
}

export interface EntityContext {
  type: 'project' | 'service'
  id: string
  name: string
}

export type LibTab = 'all' | 'cover' | 'gallery' | 'services' | 'bank'

const DEFAULT_FILTERS: AdvancedFilters = {
  mediaType: 'all',
  folderId: null,
  tagNames: [],
  associatedWith: null,
  dateRange: null,
}

const TAB_PREFIXES: Partial<Record<LibTab, string>> = {
  cover: 'projects/cover',
  gallery: 'projects/gallery',
  services: 'services',
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface MediaLibraryContextValue {
  // Data
  items: MediaObject[]
  folders: MediaFolder[]
  tags: MediaTag[]
  loading: boolean
  // Filters
  tab: LibTab
  setTab: (t: LibTab) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  filters: AdvancedFilters
  setFilters: (patch: Partial<AdvancedFilters>) => void
  clearFilters: () => void
  activeFilterCount: number
  filteredItems: MediaObject[]
  // Bank selection
  activeFolderId: string | null
  setActiveFolderId: (id: string | null) => void
  selectedTagNames: string[]
  toggleTag: (name: string) => void
  // Detail drawer
  detailItem: MediaObject | null
  openDetail: (item: MediaObject) => void
  closeDetail: () => void
  // Entity context (from ProjectForm / ServiceForm)
  entityContext: EntityContext | null
  // Mutations
  moveToFolder: (key: string, folderId: string | null) => Promise<void>
  updateMetadata: (key: string, patch: Partial<MediaMetadata>) => Promise<void>
  deleteItem: (key: string) => Promise<void>
  refreshItems: () => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<MediaFolder>
  deleteFolder: (id: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  createTag: (name: string, color: string) => Promise<MediaTag>
  deleteTag: (id: string) => Promise<void>
}

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null)

export function useMediaLibrary() {
  const ctx = useContext(MediaLibraryContext)
  if (!ctx) throw new Error('useMediaLibrary must be used inside MediaLibraryProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: ReactNode
  entityContext?: EntityContext | null
}

export function MediaLibraryProvider({ children, entityContext = null }: ProviderProps) {
  const [tab, setTabState] = useState<LibTab>('all')
  const [items, setItems] = useState<MediaObject[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [tags, setTags] = useState<MediaTag[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFiltersState] = useState<AdvancedFilters>(DEFAULT_FILTERS)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([])
  const [detailItem, setDetailItem] = useState<MediaObject | null>(null)

  const setTab = useCallback((t: LibTab) => {
    setTabState(t)
    setActiveFolderId(null)
    setSelectedTagNames([])
  }, [])

  const setFilters = useCallback((patch: Partial<AdvancedFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    setSearchQuery('')
  }, [])

  const toggleTag = useCallback((name: string) => {
    setSelectedTagNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }, [])

  // ── Data loading ──────────────────────────────────────────────────────────

  const refreshItems = useCallback(async () => {
    setLoading(true)
    try {
      const prefix = TAB_PREFIXES[tab]
      const base = prefix
        ? `/api/admin/media?prefix=${encodeURIComponent(prefix)}`
        : '/api/admin/media'
      const res = await fetch(`${base}&withAssociations=1&withMetadata=1`)
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

  const loadBank = useCallback(async () => {
    const [fRes, tRes] = await Promise.all([
      fetch('/api/admin/media/folders'),
      fetch('/api/admin/media/tags'),
    ])
    if (fRes.ok) {
      const data = await fRes.json()
      setFolders(Array.isArray(data) ? data : [])
    }
    if (tRes.ok) {
      const data = await tRes.json()
      setTags(Array.isArray(data) ? data : [])
    }
  }, [])

  useEffect(() => { refreshItems() }, [refreshItems])
  useEffect(() => { loadBank() }, [loadBank])

  // ── Derived filteredItems ─────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = items

    // Search query — matches filename or association title
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.usedIn.some((a) => a.title.toLowerCase().includes(q))
      )
    }

    // Advanced: media type
    if (filters.mediaType !== 'all') {
      result = result.filter((i) => i.mediaType === filters.mediaType)
    }

    // Advanced: association filter
    if (filters.associatedWith) {
      const { entityType, title } = filters.associatedWith
      result = result.filter((i) =>
        i.usedIn.some((a) => a.entityType === entityType && a.title === title)
      )
    }

    // Advanced: tag names (AND logic)
    if (filters.tagNames.length > 0) {
      result = result.filter((i) =>
        filters.tagNames.every((t) => i.metadata?.tags?.includes(t))
      )
    }

    // Advanced: folder
    if (filters.folderId) {
      result =
        filters.folderId === 'unfiled'
          ? result.filter((i) => !i.metadata?.folderId)
          : result.filter((i) => i.metadata?.folderId === filters.folderId)
    }

    // Advanced: date range
    if (filters.dateRange?.from) {
      const from = new Date(filters.dateRange.from).getTime()
      result = result.filter((i) => new Date(i.lastModified).getTime() >= from)
    }
    if (filters.dateRange?.to) {
      const to = new Date(filters.dateRange.to).getTime()
      result = result.filter((i) => new Date(i.lastModified).getTime() <= to)
    }

    // Bank tab: folder selection
    if (tab === 'bank' && activeFolderId) {
      if (activeFolderId === 'unfiled') {
        result = result.filter((i) => !i.metadata?.folderId)
      } else {
        result = result.filter((i) => i.metadata?.folderId === activeFolderId)
      }
    }

    // Bank tab: tag filter
    if (tab === 'bank' && selectedTagNames.length > 0) {
      result = result.filter((i) =>
        selectedTagNames.every((t) => i.metadata?.tags?.includes(t))
      )
    }

    return result
  }, [items, searchQuery, filters, tab, activeFolderId, selectedTagNames])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.mediaType !== 'all') count++
    if (filters.folderId) count++
    if (filters.tagNames.length > 0) count++
    if (filters.associatedWith) count++
    if (filters.dateRange?.from || filters.dateRange?.to) count++
    return count
  }, [filters])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const moveToFolder = useCallback(async (key: string, folderId: string | null) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              metadata: {
                ...(i.metadata ?? { id: '', key, tags: [], notes: null, width: null, height: null, duration: null, format: null }),
                folderId,
              },
            }
          : i
      )
    )
    await fetch('/api/admin/media/metadata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, folderId }),
    })
  }, [])

  const updateMetadata = useCallback(async (key: string, patch: Partial<MediaMetadata>) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              metadata: {
                ...(i.metadata ?? { id: '', key, tags: [], folderId: null, notes: null, width: null, height: null, duration: null, format: null }),
                ...patch,
              },
            }
          : i
      )
    )
    // Update detailItem in place
    setDetailItem((prev) =>
      prev?.key === key
        ? { ...prev, metadata: { ...(prev.metadata ?? { id: '', key, tags: [], folderId: null, notes: null, width: null, height: null, duration: null, format: null }), ...patch } }
        : prev
    )
    await fetch('/api/admin/media/metadata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, ...patch }),
    })
  }, [])

  const deleteItem = useCallback(async (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
    setDetailItem((prev) => (prev?.key === key ? null : prev))
    await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
  }, [])

  const createFolder = useCallback(async (name: string, parentId?: string): Promise<MediaFolder> => {
    const res = await fetch('/api/admin/media/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId: parentId ?? null }),
    })
    const folder: MediaFolder = await res.json()
    setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)))
    return folder
  }, [])

  const deleteFolder = useCallback(async (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (activeFolderId === id) setActiveFolderId(null)
    setItems((prev) =>
      prev.map((i) =>
        i.metadata?.folderId === id
          ? { ...i, metadata: { ...i.metadata!, folderId: null } }
          : i
      )
    )
    await fetch('/api/admin/media/folders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [activeFolderId])

  const renameFolder = useCallback(async (id: string, name: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f)).sort((a, b) => a.name.localeCompare(b.name))
    )
    await fetch('/api/admin/media/folders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    })
  }, [])

  const createTag = useCallback(async (name: string, color: string): Promise<MediaTag> => {
    const res = await fetch('/api/admin/media/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    const tag: MediaTag = await res.json()
    setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
    return tag
  }, [])

  const deleteTag = useCallback(async (id: string) => {
    const tag = tags.find((t) => t.id === id)
    setTags((prev) => prev.filter((t) => t.id !== id))
    if (tag) setSelectedTagNames((prev) => prev.filter((n) => n !== tag.name))
    await fetch('/api/admin/media/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [tags])

  const openDetail = useCallback((item: MediaObject) => setDetailItem(item), [])
  const closeDetail = useCallback(() => setDetailItem(null), [])

  return (
    <MediaLibraryContext.Provider
      value={{
        items,
        folders,
        tags,
        loading,
        tab,
        setTab,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        clearFilters,
        activeFilterCount,
        filteredItems,
        activeFolderId,
        setActiveFolderId,
        selectedTagNames,
        toggleTag,
        detailItem,
        openDetail,
        closeDetail,
        entityContext,
        moveToFolder,
        updateMetadata,
        deleteItem,
        refreshItems,
        createFolder,
        deleteFolder,
        renameFolder,
        createTag,
        deleteTag,
      }}
    >
      {children}
    </MediaLibraryContext.Provider>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/MediaLibraryContext.tsx
git commit -m "feat: add MediaLibraryContext with state, filters, and mutations"
```

---

## Task 2: MediaCard — draggable card with context menu trigger

**Files:**
- Create: `src/presentation/components/admin/MediaCard.tsx`

- [ ] **Step 1: Create MediaCard**

```typescript
// src/presentation/components/admin/MediaCard.tsx
'use client'

import { Film, Image, Info, Pencil, Trash2 } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import type { MediaTag } from '@/types/media'
import type { MediaObject } from './MediaLibraryContext'

interface MediaCardProps {
  item: MediaObject
  tags: MediaTag[]
  onOpenDetail: () => void
  onDelete: () => void
  onContextMenu: (e: React.MouseEvent) => void
  isDragging?: boolean
  isMini?: boolean  // for DragOverlay thumbnail
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function MediaCard({
  item,
  tags,
  onOpenDetail,
  onDelete,
  onContextMenu,
  isDragging = false,
  isMini = false,
}: MediaCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.key,
    data: { key: item.key, mediaType: item.mediaType, publicUrl: item.publicUrl },
  })

  const itemTags = (item.metadata?.tags ?? [])
    .map((name) => tags.find((t) => t.name === name))
    .filter(Boolean) as MediaTag[]

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  if (isMini) {
    return (
      <div
        className="rounded-xl overflow-hidden shadow-lg"
        style={{ width: 120, aspectRatio: '4/3', backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.4)' }}
      >
        {item.mediaType === 'image' ? (
          <img src={item.publicUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={24} style={{ color: '#A89E8C' }} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: '#1E1A16',
        border: isDragging
          ? '1.5px dashed rgba(226,192,99,0.5)'
          : '1px solid rgba(226,192,99,0.1)',
      }}
      className="group relative rounded-xl overflow-hidden transition-opacity"
      onContextMenu={onContextMenu}
    >
      {/* Drag handle — full card is draggable */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10"
        style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
      />

      <div style={{ aspectRatio: '4/3' }}>
        {item.mediaType === 'video' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <Film size={28} style={{ color: '#A89E8C' }} />
            {item.metadata?.duration != null && (
              <span className="text-[9px]" style={{ color: '#6B6560' }}>
                {Math.floor(item.metadata.duration / 60)}:{String(item.metadata.duration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        ) : item.mediaType === 'image' ? (
          <img src={item.publicUrl} alt={item.key} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={28} style={{ color: '#A89E8C' }} />
          </div>
        )}

        {/* Video type badge */}
        {item.mediaType === 'video' && (
          <span
            className="absolute top-2 left-2 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded z-20"
            style={{ backgroundColor: 'rgba(226,192,99,0.2)', color: '#E2C063' }}
          >
            Video
          </span>
        )}

        {/* Action buttons — visible on hover, above drag handle */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenDetail() }}
            className="p-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063' }}
            title="Details"
          >
            <Info size={11} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(232,112,112,0.18)', color: '#e87070' }}
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>

        {/* Bottom overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
          style={{ background: 'linear-gradient(to top, rgba(30,26,22,0.92) 0%, transparent 55%)', pointerEvents: 'none' }}
        >
          <p className="text-[10px] truncate mb-0.5" style={{ color: '#E8DCC4' }}>{item.key.split('/').pop()}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px]" style={{ color: '#A89E8C' }}>{formatBytes(item.size)}</p>
            {item.metadata?.width != null && (
              <p className="text-[10px]" style={{ color: '#6B6560' }}>
                {item.metadata.width}×{item.metadata.height}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tag chips */}
      {itemTags.length > 0 && (
        <div className="px-2 py-1.5 flex flex-wrap gap-1 relative z-20">
          {itemTags.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${t.color}18`, color: t.color, border: `1px solid ${t.color}33` }}
            >
              {t.name}
            </span>
          ))}
          {itemTags.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: '#A89E8C' }}>
              +{itemTags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/MediaCard.tsx
git commit -m "feat: add draggable MediaCard component"
```

---

## Task 3: MediaGrid — grid with DnD overlay, context menu, floating folder panel

**Files:**
- Create: `src/presentation/components/admin/MediaGrid.tsx`

- [ ] **Step 1: Create MediaGrid**

```typescript
// src/presentation/components/admin/MediaGrid.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { LayoutGrid, Folder, FolderOpen } from 'lucide-react'
import { MediaCard } from './MediaCard'
import { useMediaLibrary, type MediaObject } from './MediaLibraryContext'

// ─── ContextMenu ─────────────────────────────────────────────────────────────

interface ContextMenuState {
  item: MediaObject
  x: number
  y: number
}

function ContextMenu({
  state,
  onClose,
}: {
  state: ContextMenuState
  onClose: () => void
}) {
  const { folders, moveToFolder, openDetail, deleteItem } = useMediaLibrary()

  const [showFolderSub, setShowFolderSub] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleMove = async (folderId: string | null) => {
    await moveToFolder(state.item.key, folderId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-50 rounded-xl overflow-hidden py-1 min-w-[180px]"
        style={{
          top: state.y,
          left: state.x,
          backgroundColor: '#1E1A16',
          border: '1px solid rgba(226,192,99,0.2)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}
      >
        <MenuItem onClick={() => { openDetail(state.item); onClose() }}>
          Ver detalles
        </MenuItem>

        <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} className="my-1" />

        <div
          className="relative"
          onMouseEnter={() => setShowFolderSub(true)}
          onMouseLeave={() => setShowFolderSub(false)}
        >
          <MenuItem rightArrow>Mover a carpeta</MenuItem>
          {showFolderSub && (
            <div
              className="absolute left-full top-0 rounded-xl overflow-hidden py-1 min-w-[160px]"
              style={{
                backgroundColor: '#1E1A16',
                border: '1px solid rgba(226,192,99,0.2)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              }}
            >
              <MenuItem onClick={() => handleMove(null)} dimmed>
                Sin carpeta
              </MenuItem>
              {folders.map((f) => (
                <MenuItem key={f.id} onClick={() => handleMove(f.id)}>
                  {f.name}
                </MenuItem>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} className="my-1" />

        <MenuItem
          danger
          onClick={() => {
            if (confirm(`Eliminar "${state.item.key.split('/').pop()}"?`)) {
              deleteItem(state.item.key)
            }
            onClose()
          }}
        >
          Eliminar
        </MenuItem>
      </div>
    </>
  )
}

function MenuItem({
  children,
  onClick,
  danger,
  dimmed,
  rightArrow,
}: {
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
  dimmed?: boolean
  rightArrow?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors hover:bg-white/5"
      style={{ color: danger ? '#e87070' : dimmed ? '#6B6560' : '#E8DCC4' }}
    >
      <span>{children}</span>
      {rightArrow && <span style={{ color: '#A89E8C', fontSize: 10 }}>▶</span>}
    </button>
  )
}

// ─── Floating folder targets (appears when dragging from non-bank tabs) ───────

function FloatingFolderTargets({ activeKey }: { activeKey: string }) {
  const { folders, tab } = useMediaLibrary()

  if (tab === 'bank' || folders.length === 0) return null

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 rounded-2xl p-3 space-y-2"
      style={{
        backgroundColor: '#16120E',
        border: '1px solid rgba(226,192,99,0.25)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        minWidth: 180,
      }}
    >
      <p className="text-[9px] uppercase tracking-widest px-1 pb-1" style={{ color: '#A89E8C' }}>
        Soltar en carpeta
      </p>
      <DroppableFolderRow folderId="unfiled" label="Sin carpeta" count={0} />
      {folders.map((f) => (
        <DroppableFolderRow key={f.id} folderId={f.id} label={f.name} count={0} />
      ))}
    </div>
  )
}

function DroppableFolderRow({
  folderId,
  label,
  count,
}: {
  folderId: string
  label: string
  count: number
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `folder-${folderId}`, data: { folderId: folderId === 'unfiled' ? null : folderId } })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150"
      style={{
        backgroundColor: isOver ? 'rgba(226,192,99,0.18)' : 'rgba(226,192,99,0.04)',
        border: isOver ? '1.5px solid #E2C063' : '1px solid rgba(226,192,99,0.12)',
        transform: isOver ? 'scale(1.03)' : 'scale(1)',
        color: isOver ? '#E2C063' : '#A89E8C',
      }}
    >
      {isOver ? <FolderOpen size={14} /> : <Folder size={14} />}
      <span className="truncate">{label}</span>
    </div>
  )
}

// ─── Main MediaGrid ───────────────────────────────────────────────────────────

export function MediaGrid() {
  const {
    filteredItems,
    loading,
    tags,
    tab,
    openDetail,
    deleteItem,
    moveToFolder,
    filters,
    activeFolderId,
    selectedTagNames,
  } = useMediaLibrary()

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeDragItem = activeDragKey ? filteredItems.find((i) => i.key === activeDragKey) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveDragKey(String(event.active.id))
    setContextMenu(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragKey(null)
    const { active, over } = event
    if (!over) return
    const data = over.data.current as { folderId: string | null } | undefined
    if (data !== undefined) {
      await moveToFolder(String(active.id), data.folderId)
    }
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, item: MediaObject) => {
    e.preventDefault()
    setContextMenu({ item, x: e.clientX, y: e.clientY })
  }, [])

  const handleDelete = useCallback(
    async (key: string) => {
      if (!confirm(`Eliminar "${key.split('/').pop()}"?`)) return
      await deleteItem(key)
    },
    [deleteItem]
  )

  const isEmpty = !loading && filteredItems.length === 0

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 min-w-0">
        {loading ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ aspectRatio: '4/3', backgroundColor: 'rgba(226,192,99,0.08)' }}
              />
            ))}
          </div>
        ) : isEmpty ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-xl"
            style={{ border: '1px dashed rgba(226,192,99,0.2)', color: '#A89E8C' }}
          >
            <LayoutGrid size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No hay medios que coincidan con los filtros.</p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}
          >
            {filteredItems.map((item) => (
              <MediaCard
                key={item.key}
                item={item}
                tags={tags}
                onOpenDetail={() => openDetail(item)}
                onDelete={() => handleDelete(item.key)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                isDragging={activeDragKey === item.key}
              />
            ))}
          </div>
        )}
      </div>

      {/* DragOverlay — mini thumbnail */}
      <DragOverlay>
        {activeDragItem && (
          <MediaCard
            item={activeDragItem}
            tags={tags}
            onOpenDetail={() => {}}
            onDelete={() => {}}
            onContextMenu={() => {}}
            isMini
          />
        )}
      </DragOverlay>

      {/* Floating folder drop targets (non-bank tabs, when dragging) */}
      {activeDragKey && <FloatingFolderTargets activeKey={activeDragKey} />}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu state={contextMenu} onClose={() => setContextMenu(null)} />
      )}
    </DndContext>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/MediaGrid.tsx
git commit -m "feat: add MediaGrid with DnD, floating folder targets, and context menu"
```

---

## Task 4: MediaBankSidebar — droppable folder tree + tag panel

**Files:**
- Create: `src/presentation/components/admin/MediaBankSidebar.tsx`

- [ ] **Step 1: Create MediaBankSidebar**

```typescript
// src/presentation/components/admin/MediaBankSidebar.tsx
'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  Folder, FolderOpen, LayoutGrid, Plus, X, Check, ChevronDown, ChevronRight, Tag,
} from 'lucide-react'
import { useMediaLibrary } from './MediaLibraryContext'

const TAG_COLORS = [
  '#E2C063', '#7EC8A4', '#7EB8E2', '#E27E7E', '#C27EE2',
  '#E2A87E', '#7EE2D4', '#A8E27E',
]

// ─── Droppable folder row ─────────────────────────────────────────────────────

function DroppableFolderRow({
  folderId,
  label,
  count,
  active,
  onClick,
  onDelete,
  onRename,
}: {
  folderId: string
  label: string
  count: number
  active: boolean
  onClick: () => void
  onDelete?: () => void
  onRename?: (name: string) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `sidebar-folder-${folderId}`,
    data: { folderId: folderId === 'unfiled' ? null : folderId },
  })
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(label)

  const handleRename = () => {
    if (editVal.trim() && editVal !== label) onRename?.(editVal.trim())
    setEditing(false)
  }

  return (
    <div className="group flex items-center gap-0.5">
      <div
        ref={setNodeRef}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl text-left transition-all duration-150 min-w-0"
        style={{
          backgroundColor: isOver
            ? 'rgba(226,192,99,0.22)'
            : active
            ? 'rgba(226,192,99,0.15)'
            : 'transparent',
          border: isOver
            ? '1.5px solid #E2C063'
            : '1.5px solid transparent',
          transform: isOver ? 'scale(1.02)' : 'scale(1)',
          cursor: 'pointer',
        }}
        onClick={!editing ? onClick : undefined}
      >
        <span className="flex-shrink-0" style={{ color: active || isOver ? '#E2C063' : '#A89E8C' }}>
          {active || isOver ? <FolderOpen size={13} /> : <Folder size={13} />}
        </span>

        {editing ? (
          <input
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            onBlur={handleRename}
            className="flex-1 text-xs bg-transparent outline-none border-b min-w-0"
            style={{ color: '#E8DCC4', borderColor: 'rgba(226,192,99,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-xs font-medium truncate flex-1"
            style={{ color: active ? '#E2C063' : '#A89E8C' }}
            onDoubleClick={() => onRename && setEditing(true)}
          >
            {label}
          </span>
        )}

        <span
          className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: active ? 'rgba(226,192,99,0.2)' : 'rgba(107,101,96,0.15)',
            color: active ? '#E2C063' : '#A89E8C',
          }}
        >
          {count}
        </span>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded flex-shrink-0 transition-opacity"
          style={{ color: '#e87070' }}
          title="Eliminar carpeta"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MediaBankSidebar() {
  const {
    items,
    folders,
    tags,
    activeFolderId,
    setActiveFolderId,
    selectedTagNames,
    toggleTag,
    createFolder,
    deleteFolder,
    renameFolder,
    createTag,
    deleteTag,
  } = useMediaLibrary()

  const [foldersExpanded, setFoldersExpanded] = useState(true)
  const [tagsExpanded, setTagsExpanded] = useState(true)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  const unfiledCount = items.filter((i) => !i.metadata?.folderId).length

  const submitFolder = async () => {
    if (!newFolderName.trim()) return
    await createFolder(newFolderName.trim())
    setNewFolderName('')
    setCreatingFolder(false)
  }

  const submitTag = async () => {
    if (!newTagName.trim()) return
    await createTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setCreatingTag(false)
  }

  return (
    <aside
      className="flex-shrink-0 rounded-2xl p-3 space-y-1 overflow-y-auto"
      style={{
        width: 230,
        backgroundColor: 'rgba(226,192,99,0.03)',
        border: '1px solid rgba(226,192,99,0.1)',
        maxHeight: '70vh',
      }}
    >
      {/* FOLDERS section */}
      <button
        type="button"
        onClick={() => setFoldersExpanded((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[9px] uppercase tracking-widest"
        style={{ color: '#A89E8C' }}
      >
        {foldersExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Carpetas
      </button>

      {foldersExpanded && (
        <>
          <DroppableFolderRow
            folderId="all"
            label="Todos"
            count={items.length}
            active={activeFolderId === null}
            onClick={() => setActiveFolderId(null)}
          />
          <DroppableFolderRow
            folderId="unfiled"
            label="Sin carpeta"
            count={unfiledCount}
            active={activeFolderId === 'unfiled'}
            onClick={() => setActiveFolderId('unfiled')}
          />

          {folders.map((f) => (
            <DroppableFolderRow
              key={f.id}
              folderId={f.id}
              label={f.name}
              count={items.filter((i) => i.metadata?.folderId === f.id).length}
              active={activeFolderId === f.id}
              onClick={() => setActiveFolderId(f.id)}
              onDelete={() => {
                if (confirm(`¿Eliminar carpeta "${f.name}"?`)) deleteFolder(f.id)
              }}
              onRename={(name) => renameFolder(f.id, name)}
            />
          ))}

          {creatingFolder ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitFolder()
                  if (e.key === 'Escape') setCreatingFolder(false)
                }}
                placeholder="Nombre de carpeta…"
                className="flex-1 text-xs px-2 py-1 rounded outline-none min-w-0"
                style={{
                  backgroundColor: 'rgba(226,192,99,0.1)',
                  color: '#E8DCC4',
                  border: '1px solid rgba(226,192,99,0.25)',
                }}
              />
              <button onClick={submitFolder} className="p-1 rounded" style={{ color: '#E2C063' }}>
                <Check size={12} />
              </button>
              <button onClick={() => setCreatingFolder(false)} className="p-1 rounded" style={{ color: '#A89E8C' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingFolder(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ color: '#6B6560' }}
            >
              <Plus size={12} /> Nueva carpeta
            </button>
          )}
        </>
      )}

      <div className="my-2" style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} />

      {/* TAGS section */}
      <button
        type="button"
        onClick={() => setTagsExpanded((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[9px] uppercase tracking-widest"
        style={{ color: '#A89E8C' }}
      >
        {tagsExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Tags
      </button>

      {tagsExpanded && (
        <>
          <div className="px-2 py-1 flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const active = selectedTagNames.includes(t.name)
              const count = items.filter((i) => i.metadata?.tags?.includes(t.name)).length
              return (
                <div key={t.id} className="group/tag flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleTag(t.name)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                    style={{
                      backgroundColor: active ? `${t.color}22` : 'rgba(107,101,96,0.12)',
                      border: `1px solid ${active ? t.color : 'rgba(107,101,96,0.25)'}`,
                      color: active ? t.color : '#A89E8C',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name} ({count})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar tag "${t.name}"?`)) deleteTag(t.id)
                    }}
                    className="opacity-0 group-hover/tag:opacity-100 p-0.5 rounded transition-opacity"
                    style={{ color: '#e87070' }}
                  >
                    <X size={9} />
                  </button>
                </div>
              )
            })}
          </div>

          {creatingTag ? (
            <div className="px-2 py-1 space-y-2">
              <input
                autoFocus
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitTag()
                  if (e.key === 'Escape') setCreatingTag(false)
                }}
                placeholder="Nombre del tag…"
                className="w-full text-xs px-2 py-1 rounded outline-none"
                style={{
                  backgroundColor: 'rgba(226,192,99,0.1)',
                  color: '#E8DCC4',
                  border: '1px solid rgba(226,192,99,0.25)',
                }}
              />
              <div className="flex gap-1 flex-wrap">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className="w-5 h-5 rounded-full transition-all"
                    style={{
                      backgroundColor: c,
                      outline: newTagColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={submitTag}
                  className="flex-1 text-xs py-1 rounded font-medium"
                  style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
                >
                  Crear
                </button>
                <button
                  onClick={() => setCreatingTag(false)}
                  className="flex-1 text-xs py-1 rounded"
                  style={{ color: '#A89E8C', border: '1px solid rgba(107,101,96,0.2)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingTag(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ color: '#6B6560' }}
            >
              <Tag size={12} /> Nuevo tag
            </button>
          )}
        </>
      )}
    </aside>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/MediaBankSidebar.tsx
git commit -m "feat: add MediaBankSidebar with droppable folder tree and tag panel"
```

---

## Task 5: MediaSearchBar — search input + collapsible advanced filters

**Files:**
- Create: `src/presentation/components/admin/MediaSearchBar.tsx`

- [ ] **Step 1: Create MediaSearchBar**

```typescript
// src/presentation/components/admin/MediaSearchBar.tsx
'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { useMediaLibrary } from './MediaLibraryContext'

export function MediaSearchBar() {
  const {
    searchQuery, setSearchQuery,
    filters, setFilters, clearFilters,
    activeFilterCount,
    folders, tags, items,
  } = useMediaLibrary()

  const [expanded, setExpanded] = useState(false)

  // Unique associations from loaded items for the dropdown
  const projectTitles = Array.from(
    new Set(items.flatMap((i) => i.usedIn.filter((a) => a.entityType === 'project').map((a) => a.title)))
  )
  const serviceTitles = Array.from(
    new Set(items.flatMap((i) => i.usedIn.filter((a) => a.entityType === 'service').map((a) => a.title)))
  )

  return (
    <div className="space-y-2">
      {/* Main bar */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)' }}
        >
          <Search size={15} style={{ color: '#A89E8C', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, proyecto, tag…"
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
            style={{ color: '#E8DCC4' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: '#A89E8C' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: expanded || activeFilterCount > 0 ? 'rgba(226,192,99,0.12)' : 'transparent',
            border: `1px solid ${activeFilterCount > 0 ? '#E2C063' : 'rgba(226,192,99,0.2)'}`,
            color: activeFilterCount > 0 ? '#E2C063' : '#A89E8C',
          }}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
              style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {(activeFilterCount > 0 || searchQuery) && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: '#A89E8C', border: '1px solid rgba(226,192,99,0.15)' }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Collapsible advanced panel */}
      {expanded && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ backgroundColor: 'rgba(226,192,99,0.04)', border: '1px solid rgba(226,192,99,0.12)' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Media type */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Tipo</label>
              <div className="flex gap-1">
                {(['all', 'image', 'video'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilters({ mediaType: type })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={
                      filters.mediaType === type
                        ? { backgroundColor: '#E2C063', color: '#1E1A16' }
                        : { backgroundColor: 'rgba(226,192,99,0.06)', color: '#A89E8C', border: '1px solid rgba(226,192,99,0.12)' }
                    }
                  >
                    {type === 'all' ? 'Todos' : type === 'image' ? 'Imágenes' : 'Videos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Carpeta</label>
              <select
                value={filters.folderId ?? ''}
                onChange={(e) => setFilters({ folderId: e.target.value || null })}
                className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)', color: '#E8DCC4' }}
              >
                <option value="">Todas las carpetas</option>
                <option value="unfiled">Sin carpeta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id} style={{ backgroundColor: '#1E1A16' }}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Associated with */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Usado en</label>
              <select
                value={
                  filters.associatedWith
                    ? `${filters.associatedWith.entityType}::${filters.associatedWith.title}`
                    : ''
                }
                onChange={(e) => {
                  if (!e.target.value) { setFilters({ associatedWith: null }); return }
                  const [entityType, ...rest] = e.target.value.split('::')
                  setFilters({ associatedWith: { entityType: entityType as 'project' | 'service', title: rest.join('::') } })
                }}
                className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)', color: '#E8DCC4' }}
              >
                <option value="">Todos</option>
                {projectTitles.length > 0 && (
                  <optgroup label="Proyectos">
                    {projectTitles.map((t) => (
                      <option key={t} value={`project::${t}`}>{t}</option>
                    ))}
                  </optgroup>
                )}
                {serviceTitles.length > 0 && (
                  <optgroup label="Servicios">
                    {serviceTitles.map((t) => (
                      <option key={t} value={`service::${t}`}>{t}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Tags multi-select */}
          {tags.length > 0 && (
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const active = filters.tagNames.includes(t.name)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setFilters({
                          tagNames: active
                            ? filters.tagNames.filter((n) => n !== t.name)
                            : [...filters.tagNames, t.name],
                        })
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? `${t.color}22` : 'rgba(107,101,96,0.12)',
                        border: `1px solid ${active ? t.color : 'rgba(107,101,96,0.25)'}`,
                        color: active ? t.color : '#A89E8C',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Desde</label>
              <input
                type="date"
                value={filters.dateRange?.from ?? ''}
                onChange={(e) =>
                  setFilters({ dateRange: { from: e.target.value, to: filters.dateRange?.to ?? '' } })
                }
                className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)', color: '#E8DCC4' }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Hasta</label>
              <input
                type="date"
                value={filters.dateRange?.to ?? ''}
                onChange={(e) =>
                  setFilters({ dateRange: { from: filters.dateRange?.from ?? '', to: e.target.value } })
                }
                className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)', color: '#E8DCC4' }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/MediaSearchBar.tsx
git commit -m "feat: add MediaSearchBar with collapsible advanced filter panel"
```

---

## Task 6: AssignToEntityModal — project/service picker for Cover/Gallery

**Files:**
- Create: `src/presentation/components/admin/AssignToEntityModal.tsx`

- [ ] **Step 1: Create AssignToEntityModal**

```typescript
// src/presentation/components/admin/AssignToEntityModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Search, Check, Film, Image } from 'lucide-react'
import type { MediaObject } from './MediaLibraryContext'
import type { GalleryItem } from '@/types/media'

interface Entity {
  id: string
  name: string
  type: 'project' | 'service'
  coverUrl: string | null
}

interface AssignToEntityModalProps {
  item: MediaObject
  onClose: () => void
  onAssigned: (entityId: string, entityType: 'project' | 'service', field: 'cover' | 'gallery') => void
}

export function AssignToEntityModal({ item, onClose, onAssigned }: AssignToEntityModalProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [assignAs, setAssignAs] = useState<'cover' | 'gallery'>('cover')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/admin/projects'),
        fetch('/api/admin/services'),
      ])
      const projects = pRes.ok ? await pRes.json() : []
      const services = sRes.ok ? await sRes.json() : []

      const mapped: Entity[] = [
        ...projects.map((p: { id: string; title: string; coverImageUrl: string | null }) => ({
          id: p.id,
          name: p.title,
          type: 'project' as const,
          coverUrl: p.coverImageUrl,
        })),
        ...services.map((s: { id: string; name: string; imageUrl: string | null }) => ({
          id: s.id,
          name: s.name,
          type: 'service' as const,
          coverUrl: s.imageUrl,
        })),
      ]
      setEntities(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = entities.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )
  const projects = filtered.filter((e) => e.type === 'project')
  const services = filtered.filter((e) => e.type === 'service')

  async function handleAssign() {
    if (!selectedId) return
    const entity = entities.find((e) => e.id === selectedId)
    if (!entity) return

    setSaving(true)
    try {
      const apiBase = entity.type === 'project'
        ? `/api/admin/projects/${entity.id}`
        : `/api/admin/services/${entity.id}`

      let body: Record<string, unknown>
      if (assignAs === 'cover') {
        body = entity.type === 'project'
          ? { coverImageUrl: item.publicUrl }
          : { imageUrl: item.publicUrl }
      } else {
        // Fetch current gallery to append
        const getRes = await fetch(apiBase)
        const current = getRes.ok ? await getRes.json() : {}
        const currentGallery: GalleryItem[] = entity.type === 'project'
          ? (current.galleryItems ?? current.galleryUrls ?? [])
          : (current.galleryItems ?? [])
        const newItem: GalleryItem = {
          url: item.publicUrl,
          order: currentGallery.length,
        }
        body = { galleryItems: [...currentGallery, newItem] }
      }

      await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      onAssigned(entity.id, entity.type, assignAs)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative rounded-2xl w-full max-w-md"
        style={{ backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.2)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}>
          <h2 className="text-base font-semibold" style={{ color: '#E8DCC4', fontFamily: 'var(--font-cormorant)' }}>
            Asignar medio
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#A89E8C' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Preview */}
          <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ height: 100, backgroundColor: '#150F0A' }}>
            {item.mediaType === 'image' ? (
              <img src={item.publicUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <Film size={28} style={{ color: '#A89E8C' }} />
            )}
          </div>

          {/* Assign as */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>
              Asignar como
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['cover', 'gallery'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAssignAs(opt)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                  style={
                    assignAs === opt
                      ? { backgroundColor: 'rgba(226,192,99,0.18)', border: '1.5px solid #E2C063', color: '#E2C063' }
                      : { backgroundColor: 'rgba(226,192,99,0.04)', border: '1px solid rgba(226,192,99,0.15)', color: '#A89E8C' }
                  }
                >
                  <div className="flex items-center gap-2">
                    {assignAs === opt && <Check size={14} strokeWidth={3} />}
                    {opt === 'cover' ? 'Cover / Portada' : 'Agregar a Galería'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>
              Proyecto / Servicio
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
              style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)' }}
            >
              <Search size={13} style={{ color: '#A89E8C' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#E8DCC4' }}
              />
            </div>

            {loading ? (
              <div className="py-6 text-center text-sm" style={{ color: '#A89E8C' }}>Cargando…</div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {projects.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1.5 px-1" style={{ color: '#A89E8C' }}>Proyectos</p>
                    {projects.map((e) => (
                      <EntityRow key={e.id} entity={e} selected={selectedId === e.id} onSelect={() => setSelectedId(e.id)} />
                    ))}
                  </div>
                )}
                {services.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1.5 px-1" style={{ color: '#A89E8C' }}>Servicios</p>
                    {services.map((e) => (
                      <EntityRow key={e.id} entity={e} selected={selectedId === e.id} onSelect={() => setSelectedId(e.id)} />
                    ))}
                  </div>
                )}
                {filtered.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: '#6B6560' }}>Sin resultados</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(226,192,99,0.1)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: '#A89E8C' }}>Cancelar</button>
          <button
            onClick={handleAssign}
            disabled={!selectedId || saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            {saving ? 'Asignando…' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EntityRow({ entity, selected, onSelect }: { entity: Entity; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-all"
      style={{
        backgroundColor: selected ? 'rgba(226,192,99,0.15)' : 'rgba(226,192,99,0.04)',
        border: `1px solid ${selected ? '#E2C063' : 'rgba(226,192,99,0.08)'}`,
        color: selected ? '#E2C063' : '#E8DCC4',
      }}
    >
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ width: 36, height: 36, backgroundColor: '#150F0A' }}
      >
        {entity.coverUrl ? (
          <img src={entity.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Image size={16} style={{ color: '#A89E8C' }} />
        )}
      </div>
      <span className="flex-1 truncate font-medium">{entity.name}</span>
      {selected && <Check size={14} strokeWidth={3} />}
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/AssignToEntityModal.tsx
git commit -m "feat: add AssignToEntityModal for cover/gallery assignment"
```

---

## Task 7: MediaDetailDrawer — right-side sliding panel

**Files:**
- Create: `src/presentation/components/admin/MediaDetailDrawer.tsx`

- [ ] **Step 1: Create MediaDetailDrawer**

```typescript
// src/presentation/components/admin/MediaDetailDrawer.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Film, Image as ImageIcon, ExternalLink, Maximize2, Trash2, ImagePlus } from 'lucide-react'
import { useMediaLibrary } from './MediaLibraryContext'
import { AssignToEntityModal } from './AssignToEntityModal'
import { aspectRatio, formatDuration } from '@/presentation/lib/extractMediaMetadata'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatMime(fmt: string | null | undefined): string {
  if (!fmt) return '—'
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG', 'image/jpg': 'JPEG', 'image/png': 'PNG',
    'image/webp': 'WebP', 'image/gif': 'GIF', 'image/avif': 'AVIF',
    'image/svg+xml': 'SVG', 'video/mp4': 'MP4', 'video/webm': 'WebM',
    'video/ogg': 'OGG', 'video/quicktime': 'MOV',
  }
  return map[fmt] ?? fmt.split('/')[1]?.toUpperCase() ?? fmt
}

const FIELD_LABELS = { cover: 'Cover', gallery: 'Galería', poster: 'Poster', image: 'Imagen' }

const TAG_COLORS = ['#E2C063','#7EC8A4','#7EB8E2','#E27E7E','#C27EE2','#E2A87E','#7EE2D4','#A8E27E']

export function MediaDetailDrawer() {
  const { detailItem, closeDetail, folders, tags, updateMetadata, deleteItem, entityContext } = useMediaLibrary()

  const [copied, setCopied] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState<'cover' | 'gallery' | null>(null)
  const [assignConfirm, setAssignConfirm] = useState<string | null>(null)
  // Lazy dimension measurement
  const [measuredDims, setMeasuredDims] = useState<{ width: number; height: number } | null>(null)
  const [measuredDuration, setMeasuredDuration] = useState<number | null>(null)
  // Local edit state (auto-save on blur)
  const [localFolderId, setLocalFolderId] = useState<string>('')
  const [localNotes, setLocalNotes] = useState<string>('')
  const [localTags, setLocalTags] = useState<string[]>([])

  const item = detailItem

  useEffect(() => {
    if (!item) { setMeasuredDims(null); setMeasuredDuration(null); return }
    setLocalFolderId(item.metadata?.folderId ?? '')
    setLocalNotes(item.metadata?.notes ?? '')
    setLocalTags(item.metadata?.tags ?? [])

    if (!item.metadata?.width && item.mediaType === 'image') {
      const img = document.createElement('img')
      img.onload = () => setMeasuredDims({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = item.publicUrl
    }
    if (!item.metadata?.duration && item.mediaType === 'video') {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        if (isFinite(video.duration)) setMeasuredDuration(Math.round(video.duration))
        if (!item.metadata?.width && video.videoWidth)
          setMeasuredDims({ width: video.videoWidth, height: video.videoHeight })
      }
      video.src = item.publicUrl
    }
  }, [item])

  if (!item) return null

  const width = item.metadata?.width ?? measuredDims?.width ?? null
  const height = item.metadata?.height ?? measuredDims?.height ?? null
  const duration = item.metadata?.duration ?? measuredDuration ?? null

  const handleCopy = () => {
    navigator.clipboard.writeText(item.publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFolderChange = async (folderId: string) => {
    setLocalFolderId(folderId)
    await updateMetadata(item.key, { folderId: folderId || null })
  }

  const handleNotesBlur = async () => {
    await updateMetadata(item.key, { notes: localNotes || null })
  }

  const toggleLocalTag = async (name: string) => {
    const next = localTags.includes(name)
      ? localTags.filter((t) => t !== name)
      : [...localTags, name]
    setLocalTags(next)
    await updateMetadata(item.key, { tags: next })
  }

  const handleDelete = async () => {
    if (!confirm(`Eliminar "${item.key.split('/').pop()}"?`)) return
    await deleteItem(item.key)
  }

  const handleAssignedEntity = (_id: string, _type: string, field: 'cover' | 'gallery') => {
    setAssignConfirm(field === 'cover' ? 'Asignado como cover ✓' : 'Agregado a galería ✓')
    setTimeout(() => setAssignConfirm(null), 3000)
  }

  const handleQuickAssign = async (field: 'cover' | 'gallery') => {
    if (!entityContext) { setAssignModalOpen(field); return }
    // Auto-assign to entityContext
    const apiBase = entityContext.type === 'project'
      ? `/api/admin/projects/${entityContext.id}`
      : `/api/admin/services/${entityContext.id}`

    let body: Record<string, unknown>
    if (field === 'cover') {
      body = entityContext.type === 'project'
        ? { coverImageUrl: item.publicUrl }
        : { imageUrl: item.publicUrl }
    } else {
      const getRes = await fetch(apiBase)
      const current = getRes.ok ? await getRes.json() : {}
      const currentGallery = current.galleryItems ?? current.galleryUrls ?? []
      body = { galleryItems: [...currentGallery, { url: item.publicUrl, order: currentGallery.length }] }
    }
    await fetch(apiBase, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setAssignConfirm(field === 'cover' ? `Cover de "${entityContext.name}" actualizado ✓` : `Agregado a galería de "${entityContext.name}" ✓`)
    setTimeout(() => setAssignConfirm(null), 3000)
  }

  const filename = item.key.split('/').pop() ?? item.key

  return (
    <>
      <aside
        className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: 340,
          backgroundColor: '#16120E',
          border: '1px solid rgba(226,192,99,0.15)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}
        >
          <h3
            className="text-sm font-semibold truncate pr-2"
            style={{ color: '#E8DCC4', fontFamily: 'var(--font-cormorant)', fontSize: 16 }}
            title={filename}
          >
            {filename}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={item.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg"
              style={{ color: '#A89E8C' }}
              title="Abrir en nueva pestaña"
            >
              <ExternalLink size={14} />
            </a>
            <button onClick={closeDetail} className="p-1.5 rounded-lg" style={{ color: '#A89E8C' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          <div
            className="flex items-center justify-center"
            style={{ aspectRatio: '16/9', backgroundColor: '#0D0A08' }}
          >
            {item.mediaType === 'image' ? (
              <img src={item.publicUrl} alt={filename} className="w-full h-full object-contain" />
            ) : item.mediaType === 'video' ? (
              <video src={item.publicUrl} controls className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2" style={{ color: '#A89E8C' }}>
                <ImageIcon size={28} />
                <span className="text-xs">Sin preview</span>
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-5">
            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <MetaField label="Tamaño" value={formatBytes(item.size)} />
              <MetaField label="Formato" value={formatMime(item.metadata?.format)} />
              <MetaField
                label="Modificado"
                value={new Date(item.lastModified).toLocaleDateString('es-AR', { dateStyle: 'medium' })}
              />
              <MetaField label="Tipo" value={item.mediaType === 'image' ? 'Imagen' : item.mediaType === 'video' ? 'Video' : 'Otro'} />
              {width != null && height != null && (
                <>
                  <MetaField label="Dimensiones" value={`${width} × ${height}`} />
                  <MetaField label="Aspect Ratio" value={aspectRatio(width, height)} gold />
                </>
              )}
              {duration != null && (
                <MetaField label="Duración" value={formatDuration(duration)} />
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} />

            {/* Organization */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#A89E8C' }}>Organización</p>

              {/* Folder */}
              <div>
                <label className="text-[10px] block mb-1" style={{ color: '#6B6560' }}>Carpeta</label>
                <select
                  value={localFolderId}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.12)', color: '#E8DCC4' }}
                >
                  <option value="">Sin carpeta</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id} style={{ backgroundColor: '#1E1A16' }}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <label className="text-[10px] block mb-1.5" style={{ color: '#6B6560' }}>Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => {
                      const active = localTags.includes(t.name)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleLocalTag(t.name)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                          style={{
                            backgroundColor: active ? `${t.color}22` : 'rgba(107,101,96,0.1)',
                            border: `1px solid ${active ? t.color : 'rgba(107,101,96,0.2)'}`,
                            color: active ? t.color : '#6B6560',
                          }}
                        >
                          {active && <Check size={9} strokeWidth={3} />}
                          {t.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[10px] block mb-1" style={{ color: '#6B6560' }}>Notas</label>
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  rows={2}
                  placeholder="Notas internas…"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none resize-none"
                  style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.12)', color: '#E8DCC4' }}
                />
              </div>
            </div>

            {/* URL */}
            <div>
              <div className="flex items-center gap-2">
                <p
                  className="flex-1 text-[10px] font-mono truncate px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(226,192,99,0.05)', color: '#6B6560', border: '1px solid rgba(226,192,99,0.08)' }}
                >
                  {item.publicUrl}
                </p>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: copied ? 'rgba(82,183,136,0.15)' : 'rgba(226,192,99,0.08)',
                    color: copied ? '#52B788' : '#E2C063',
                  }}
                  title="Copiar URL"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Used In */}
            {item.usedIn.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#A89E8C' }}>Usado en</p>
                <div className="space-y-1">
                  {item.usedIn.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
                      style={{ backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.08)' }}
                    >
                      <span className="truncate" style={{ color: '#E8DCC4' }}>{a.title}</span>
                      <span
                        className="flex-shrink-0 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full ml-2"
                        style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#E2C063' }}
                      >
                        {FIELD_LABELS[a.field]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky action bar */}
        <div
          className="flex-shrink-0 px-4 py-3 space-y-2"
          style={{ borderTop: '1px solid rgba(226,192,99,0.1)' }}
        >
          {assignConfirm && (
            <div
              className="text-xs text-center py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(82,183,136,0.15)', color: '#52B788' }}
            >
              {assignConfirm}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAssign('cover')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ backgroundColor: 'rgba(226,192,99,0.12)', border: '1px solid rgba(226,192,99,0.25)', color: '#E2C063' }}
            >
              <ImageIcon size={13} />
              Usar como Cover
            </button>
            <button
              type="button"
              onClick={() => handleQuickAssign('gallery')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ backgroundColor: 'rgba(226,192,99,0.12)', border: '1px solid rgba(226,192,99,0.25)', color: '#E2C063' }}
            >
              <ImagePlus size={13} />
              Agregar a Galería
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ backgroundColor: 'rgba(232,112,112,0.1)', border: '1px solid rgba(232,112,112,0.2)', color: '#e87070' }}
          >
            <Trash2 size={13} />
            Eliminar archivo
          </button>
        </div>
      </aside>

      {assignModalOpen && (
        <AssignToEntityModal
          item={item}
          onClose={() => setAssignModalOpen(null)}
          onAssigned={handleAssignedEntity}
        />
      )}
    </>
  )
}

function MetaField({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#6B6560' }}>{label}</p>
      <p className="text-xs font-medium" style={{ color: gold ? '#E2C063' : '#E8DCC4' }}>{value}</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/MediaDetailDrawer.tsx src/presentation/components/admin/AssignToEntityModal.tsx
git commit -m "feat: add MediaDetailDrawer with metadata, org edit, and assign actions"
```

---

## Task 8: Rewrite MediaLibrary.tsx as ~120-line orchestrator

**Files:**
- Rewrite: `src/presentation/components/admin/MediaLibrary.tsx`

- [ ] **Step 1: Replace MediaLibrary.tsx**

```typescript
// src/presentation/components/admin/MediaLibrary.tsx
'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { MediaLibraryProvider, useMediaLibrary, type EntityContext } from './MediaLibraryContext'
import { MediaSearchBar } from './MediaSearchBar'
import { MediaGrid } from './MediaGrid'
import { MediaBankSidebar } from './MediaBankSidebar'
import { MediaDetailDrawer } from './MediaDetailDrawer'
import { extractMediaMetadata } from '@/presentation/lib/extractMediaMetadata'

// ─── Association sidebar (non-Bank tabs) ─────────────────────────────────────

function AssociationSidebar() {
  const { items, filters, setFilters } = useMediaLibrary()

  const projectEntries = Array.from(
    new Map(
      items.flatMap((i) =>
        i.usedIn
          .filter((a) => a.entityType === 'project')
          .map((a) => [a.title, a] as [string, typeof a])
      )
    ).values()
  )
  const serviceEntries = Array.from(
    new Map(
      items.flatMap((i) =>
        i.usedIn
          .filter((a) => a.entityType === 'service')
          .map((a) => [a.title, a] as [string, typeof a])
      )
    ).values()
  )
  const hasUnassigned = items.some((i) => i.usedIn.length === 0)

  if (!hasUnassigned && projectEntries.length === 0 && serviceEntries.length === 0) return null

  const activeTitle = filters.associatedWith?.title ?? null
  const isUnassigned = filters.folderId === 'unassigned-filter'

  const SidebarBtn = ({
    label, count, active, onClick,
  }: { label: string; count: number; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
      style={active ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#E2C063' } : { color: '#6B6560' }}
    >
      <span className="text-xs font-medium truncate flex-1">{label}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: active ? 'rgba(226,192,99,0.2)' : 'rgba(107,101,96,0.15)', color: active ? '#E2C063' : '#A89E8C' }}>
        {count}
      </span>
    </button>
  )

  return (
    <aside
      className="flex-shrink-0 rounded-xl p-3 space-y-1"
      style={{ width: 210, backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.1)' }}
    >
      <SidebarBtn label="Todos" count={items.length} active={!activeTitle && !isUnassigned} onClick={() => setFilters({ associatedWith: null, folderId: null })} />
      {hasUnassigned && (
        <SidebarBtn
          label="Sin asignar"
          count={items.filter((i) => i.usedIn.length === 0).length}
          active={isUnassigned}
          onClick={() => setFilters({ folderId: 'unassigned-filter' })}
        />
      )}
      {projectEntries.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>Proyectos</p>
          {projectEntries.map((a) => (
            <SidebarBtn
              key={a.title}
              label={a.title}
              count={items.filter((i) => i.usedIn.some((u) => u.title === a.title)).length}
              active={activeTitle === a.title}
              onClick={() => setFilters({ associatedWith: { entityType: 'project', title: a.title }, folderId: null })}
            />
          ))}
        </>
      )}
      {serviceEntries.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>Servicios</p>
          {serviceEntries.map((a) => (
            <SidebarBtn
              key={a.title}
              label={a.title}
              count={items.filter((i) => i.usedIn.some((u) => u.title === a.title)).length}
              active={activeTitle === a.title}
              onClick={() => setFilters({ associatedWith: { entityType: 'service', title: a.title }, folderId: null })}
            />
          ))}
        </>
      )}
    </aside>
  )
}

// ─── Inner orchestrator (consumes Context) ────────────────────────────────────

const TAB_PREFIXES: Record<string, string | undefined> = {
  cover: 'projects/cover',
  gallery: 'projects/gallery',
  services: 'services',
}

const TAB_LIST = [
  { key: 'all', label: 'Todos' },
  { key: 'cover', label: 'Portadas' },
  { key: 'gallery', label: 'Galería' },
  { key: 'services', label: 'Servicios' },
  { key: 'bank', label: 'Bank' },
]

function MediaLibraryInner() {
  const { tab, setTab, detailItem, loading, refreshItems } = useMediaLibrary()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingName, setUploadingName] = useRef<string | null>(null) as unknown as [string | null, (v: string | null) => void]

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const prefix = TAB_PREFIXES[tab] ?? 'projects/gallery'
    setUploadingName(file.name)
    try {
      const meta = await extractMediaMetadata(file)
      const presignRes = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, filename: file.name, contentType: file.type }),
      })
      if (!presignRes.ok) { alert('Error al obtener URL de subida'); return }
      const { presignedUrl, key } = await presignRes.json()
      await fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (Object.keys(meta).length > 0) {
        await fetch('/api/admin/media/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, ...meta }),
        })
      }
      await refreshItems()
    } finally {
      setUploadingName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <MediaSearchBar />

      {/* Tabs + Upload */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {TAB_LIST.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Parameters<typeof setTab>[0])}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                tab === t.key
                  ? { backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063' }
                  : { color: '#6B6560' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            <Upload size={15} />
            Subir archivo
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-5 items-start">
        {tab === 'bank' && !loading && <MediaBankSidebar />}
        {tab !== 'bank' && !loading && <AssociationSidebar />}
        <MediaGrid />
        {detailItem && <MediaDetailDrawer />}
      </div>
    </div>
  )
}

// ─── Public export: wraps in Provider ────────────────────────────────────────

interface MediaLibraryProps {
  entityContext?: EntityContext | null
}

export function MediaLibrary({ entityContext }: MediaLibraryProps = {}) {
  return (
    <MediaLibraryProvider entityContext={entityContext}>
      <MediaLibraryInner />
    </MediaLibraryProvider>
  )
}
```

> **Note:** The `useRef<string | null>` pattern for `uploadingName` keeps the upload state local without triggering re-renders on the entire context. If you prefer a `useState`, swap the line — both work.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/MediaLibrary.tsx
git commit -m "refactor: reduce MediaLibrary to 120-line orchestrator using Context"
```

---

## Task 9: MediaPickerModal — association badges + entityContext support

**Files:**
- Modify: `src/presentation/components/admin/MediaPickerModal.tsx`

- [ ] **Step 1: Add `entityContext` prop and association badge logic**

In `MediaPickerModal.tsx`, make two targeted changes:

**Change 1 — Add prop to interface:**
```typescript
// Add to MediaPickerModalProps interface:
entityContext?: { type: 'project' | 'service'; id: string; name: string } | null
```

**Change 2 — Add badge rendering inside the grid item button (after the filename tooltip div):**
```typescript
{/* Association badges */}
{(() => {
  if (!item.usedIn?.length) return null
  const isOwnEntity = entityContext && item.usedIn.some(
    (a) => a.entityType === entityContext.type && a.title === entityContext.name
  )
  if (isOwnEntity) {
    return (
      <div
        className="absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center gap-1"
        style={{ backgroundColor: 'rgba(82,183,136,0.18)' }}
      >
        <Check size={9} strokeWidth={3} style={{ color: '#52B788', flexShrink: 0 }} />
        <span className="text-[9px] truncate" style={{ color: '#52B788' }}>Ya asignado</span>
      </div>
    )
  }
  // Show first association as gold badge
  const first = item.usedIn[0]
  const FIELDS = { cover: 'Cover', gallery: 'Galería', poster: 'Poster', image: 'Imagen' }
  return (
    <div
      className="absolute bottom-0 left-0 px-1.5 py-0.5 m-1.5 rounded-full flex items-center gap-1"
      style={{ backgroundColor: 'rgba(226,192,99,0.2)', border: '1px solid rgba(226,192,99,0.3)' }}
    >
      <span className="text-[8px] truncate max-w-[80px]" style={{ color: '#E2C063' }}>
        {FIELDS[first.field]} — {first.title}
      </span>
      {item.usedIn.length > 1 && (
        <span className="text-[8px]" style={{ color: '#E2C063' }}>+{item.usedIn.length - 1}</span>
      )}
    </div>
  )
})()}
```

**Change 3 — Pass `entityContext` to the MediaPickerModal when used from ProjectForm/ServiceForm** (update callers):

In `ProjectForm.tsx` and `ServiceForm.tsx`, when rendering `<MediaPickerModal>`, add:
```typescript
entityContext={{ type: 'project', id: project.id, name: formData.title }}
// or for ServiceForm:
entityContext={{ type: 'service', id: service.id, name: formData.name }}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Build check**

```bash
npx next build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` with no type errors (build-time DB warnings for missing columns in dev are normal).

- [ ] **Step 4: Commit**

```bash
git add src/presentation/components/admin/MediaPickerModal.tsx
git commit -m "feat: add association badges and entityContext to MediaPickerModal"
```

---

## Task 10: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 2: Run dev server and smoke-test manually**

```bash
npm run dev
```

Manually verify in browser at `http://localhost:3000/admin/media`:
- [ ] Search bar visible above tabs, filters expand/collapse
- [ ] Bank tab shows sidebar with folder tree + tag panel
- [ ] Dragging a card to a folder row moves it (optimistic update in grid)
- [ ] Right-click on a card shows context menu with Move/Delete options
- [ ] Clicking info icon opens the Detail Drawer (right side panel slides in)
- [ ] Drawer shows dimensions, aspect ratio, format, duration for video
- [ ] "Usar como Cover" opens AssignToEntityModal
- [ ] Can create a folder, rename it (double-click), delete it
- [ ] Can create a tag with a color, assign to a media item from drawer
- [ ] Advanced search filters work (media type, folder, association)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Media Library v3 — Context, DnD, search, drawer, assign-to-entity"
```

---

## SQL Migration (run in EasyPanel if not already applied)

The three tables from the previous session should already exist. If not:

```sql
CREATE TABLE IF NOT EXISTS media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#E2C063',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS media_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  format VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_metadata_key ON media_metadata(key);
CREATE INDEX IF NOT EXISTS idx_media_metadata_folder ON media_metadata(folder_id);
```
