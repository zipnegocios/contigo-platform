'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

export type LibTab = 'all' | 'projects' | 'services' | 'unassigned' | 'bank'

const DEFAULT_FILTERS: AdvancedFilters = {
  mediaType: 'all',
  folderId: null,
  tagNames: [],
  associatedWith: null,
  dateRange: null,
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface MediaLibraryContextValue {
  items: MediaObject[]
  folders: MediaFolder[]
  tags: MediaTag[]
  loading: boolean
  tab: LibTab
  setTab: (t: LibTab) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  filters: AdvancedFilters
  setFilters: (patch: Partial<AdvancedFilters>) => void
  clearFilters: () => void
  activeFilterCount: number
  filteredItems: MediaObject[]
  activeFolderId: string | null
  setActiveFolderId: (id: string | null) => void
  selectedTagNames: string[]
  toggleTag: (name: string) => void
  detailItem: MediaObject | null
  openDetail: (item: MediaObject) => void
  closeDetail: () => void
  entityContext: EntityContext | null
  // Single-item mutations
  moveToFolder: (key: string, folderId: string | null) => Promise<void>
  updateMetadata: (key: string, patch: Partial<MediaMetadata>) => Promise<void>
  deleteItem: (key: string) => Promise<void>
  refreshItems: () => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<MediaFolder>
  deleteFolder: (id: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  createTag: (name: string, color: string) => Promise<MediaTag>
  deleteTag: (id: string) => Promise<void>
  renameTag: (id: string, name: string) => Promise<void>
  renameMedia: (key: string, newName: string) => Promise<void>
  // Bulk selection
  selectedKeys: string[]
  toggleSelectKey: (key: string) => void
  clearSelection: () => void
  selectAllFiltered: () => void
  bulkMoveToFolder: (folderId: string | null) => Promise<void>
  bulkDelete: () => Promise<void>
  bulkAddTag: (tagName: string) => Promise<void>
  bulkRemoveTag: (tagName: string) => Promise<void>
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
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const setTab = useCallback((t: LibTab) => {
    setTabState(t)
    setActiveFolderId(null)
    setSelectedTagNames([])
    setSelectedKeys([])
    setFiltersState(DEFAULT_FILTERS)
    setSearchQuery('')
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
      const res = await fetch('/api/admin/media?withAssociations=1&withMetadata=1')
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

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

    // Tab-level association filter
    if (tab === 'projects') {
      result = result.filter((i) => i.usedIn.some((a) => a.entityType === 'project'))
    } else if (tab === 'services') {
      result = result.filter((i) => i.usedIn.some((a) => a.entityType === 'service'))
    } else if (tab === 'unassigned') {
      result = result.filter((i) => i.usedIn.length === 0)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.usedIn.some((a) => a.title.toLowerCase().includes(q))
      )
    }

    if (filters.mediaType !== 'all') {
      result = result.filter((i) => i.mediaType === filters.mediaType)
    }

    if (filters.associatedWith) {
      const { entityType, title } = filters.associatedWith
      result = result.filter((i) =>
        i.usedIn.some((a) => a.entityType === entityType && a.title === title)
      )
    }

    if (filters.tagNames.length > 0) {
      result = result.filter((i) =>
        filters.tagNames.every((t) => i.metadata?.tags?.includes(t))
      )
    }

    if (filters.folderId === 'unassigned-filter') {
      result = result.filter((i) => i.usedIn.length === 0)
    } else if (filters.folderId === 'unfiled') {
      result = result.filter((i) => !i.metadata?.folderId)
    } else if (filters.folderId) {
      result = result.filter((i) => i.metadata?.folderId === filters.folderId)
    }

    if (filters.dateRange?.from) {
      const from = new Date(filters.dateRange.from).getTime()
      result = result.filter((i) => new Date(i.lastModified).getTime() >= from)
    }
    if (filters.dateRange?.to) {
      const to = new Date(filters.dateRange.to).getTime()
      result = result.filter((i) => new Date(i.lastModified).getTime() <= to)
    }

    if (tab === 'bank' && activeFolderId) {
      if (activeFolderId === 'unfiled') {
        result = result.filter((i) => !i.metadata?.folderId)
      } else {
        result = result.filter((i) => i.metadata?.folderId === activeFolderId)
      }
    }

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

  // ── Single-item mutations ─────────────────────────────────────────────────

  const blankMeta = (key: string): MediaMetadata => ({
    id: '', key, tags: [], folderId: null, notes: null,
    width: null, height: null, duration: null, format: null,
    optimized: false,
  })

  const moveToFolder = useCallback(async (key: string, folderId: string | null) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, metadata: { ...(i.metadata ?? blankMeta(key)), folderId } } : i
      )
    )
    await fetch('/api/admin/media/metadata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, folderId }),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateMetadata = useCallback(async (key: string, patch: Partial<MediaMetadata>) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, metadata: { ...(i.metadata ?? blankMeta(key)), ...patch } } : i
      )
    )
    setDetailItem((prev) =>
      prev?.key === key ? { ...prev, metadata: { ...(prev.metadata ?? blankMeta(key)), ...patch } } : prev
    )
    await fetch('/api/admin/media/metadata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, ...patch }),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteItem = useCallback(async (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
    setDetailItem((prev) => (prev?.key === key ? null : prev))
    setSelectedKeys((prev) => prev.filter((k) => k !== key))
    await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
  }, [])

  const renameMedia = useCallback(async (key: string, newName: string) => {
    await fetch('/api/admin/media/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, newName }),
    })
    await refreshItems()
  }, [refreshItems])

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
    setActiveFolderId((prev) => (prev === id ? null : prev))
    setItems((prev) =>
      prev.map((i) =>
        i.metadata?.folderId === id ? { ...i, metadata: { ...i.metadata!, folderId: null } } : i
      )
    )
    await fetch('/api/admin/media/folders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [])

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

  // Note: tags are referenced by name (not id) in mediaMetadata.tags, unlike
  // folders which use a stable folderId. Renaming a tag does not cascade into
  // items' stored tag-name arrays — a pre-existing property of this system.
  const renameTag = useCallback(async (id: string, name: string) => {
    setTags((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t)).sort((a, b) => a.name.localeCompare(b.name))
    )
    await fetch('/api/admin/media/tags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    })
  }, [])

  const openDetail = useCallback((item: MediaObject) => setDetailItem(item), [])
  const closeDetail = useCallback(() => setDetailItem(null), [])

  // ── Bulk selection ────────────────────────────────────────────────────────

  const toggleSelectKey = useCallback((key: string) => {
    setSelectedKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }, [])

  const clearSelection = useCallback(() => setSelectedKeys([]), [])

  const selectAllFiltered = useCallback(() => {
    setSelectedKeys(filteredItems.map((i) => i.key))
  }, [filteredItems])

  const bulkMoveToFolder = useCallback(async (folderId: string | null) => {
    const keys = selectedKeys.slice()
    setItems((prev) =>
      prev.map((i) =>
        keys.includes(i.key) ? { ...i, metadata: { ...(i.metadata ?? blankMeta(i.key)), folderId } } : i
      )
    )
    setSelectedKeys([])
    await Promise.all(
      keys.map((key) =>
        fetch('/api/admin/media/metadata', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, folderId }),
        })
      )
    )
  }, [selectedKeys]) // eslint-disable-line react-hooks/exhaustive-deps

  const bulkDelete = useCallback(async () => {
    const keys = selectedKeys.slice()
    setItems((prev) => prev.filter((i) => !keys.includes(i.key)))
    setDetailItem((prev) => (prev && keys.includes(prev.key) ? null : prev))
    setSelectedKeys([])
    await Promise.all(
      keys.map((key) =>
        fetch('/api/admin/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      )
    )
  }, [selectedKeys])

  const bulkAddTag = useCallback(async (tagName: string) => {
    const keys = selectedKeys.slice()
    const snapshot = items
    setItems((prev) =>
      prev.map((i) => {
        if (!keys.includes(i.key)) return i
        const cur = i.metadata?.tags ?? []
        if (cur.includes(tagName)) return i
        return { ...i, metadata: { ...(i.metadata ?? blankMeta(i.key)), tags: [...cur, tagName] } }
      })
    )
    await Promise.all(
      keys.map(async (key) => {
        const item = snapshot.find((i) => i.key === key)
        const cur = item?.metadata?.tags ?? []
        if (cur.includes(tagName)) return
        await fetch('/api/admin/media/metadata', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, tags: [...cur, tagName] }),
        })
      })
    )
  }, [selectedKeys, items]) // eslint-disable-line react-hooks/exhaustive-deps

  const bulkRemoveTag = useCallback(async (tagName: string) => {
    const keys = selectedKeys.slice()
    const snapshot = items
    setItems((prev) =>
      prev.map((i) => {
        if (!keys.includes(i.key)) return i
        const cur = i.metadata?.tags ?? []
        return { ...i, metadata: { ...(i.metadata ?? blankMeta(i.key)), tags: cur.filter((t) => t !== tagName) } }
      })
    )
    await Promise.all(
      keys.map(async (key) => {
        const item = snapshot.find((i) => i.key === key)
        const cur = item?.metadata?.tags ?? []
        await fetch('/api/admin/media/metadata', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, tags: cur.filter((t) => t !== tagName) }),
        })
      })
    )
  }, [selectedKeys, items]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MediaLibraryContext.Provider
      value={{
        items, folders, tags, loading, tab, setTab,
        searchQuery, setSearchQuery,
        filters, setFilters, clearFilters, activeFilterCount,
        filteredItems,
        activeFolderId, setActiveFolderId,
        selectedTagNames, toggleTag,
        detailItem, openDetail, closeDetail,
        entityContext,
        moveToFolder, updateMetadata, deleteItem, refreshItems,
        createFolder, deleteFolder, renameFolder, createTag, deleteTag, renameTag,
        renameMedia,
        selectedKeys, toggleSelectKey, clearSelection, selectAllFiltered,
        bulkMoveToFolder, bulkDelete, bulkAddTag, bulkRemoveTag,
      }}
    >
      {children}
    </MediaLibraryContext.Provider>
  )
}
