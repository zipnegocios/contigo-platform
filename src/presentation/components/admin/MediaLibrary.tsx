'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Trash2, Upload, Film, Image, LayoutGrid, Folder, FolderOpen,
  Info, Pencil, Plus, X, Tag, ChevronRight, ChevronDown, Check,
} from 'lucide-react'
import type { AssociationInfo, MediaFolder, MediaTag, MediaMetadata } from '@/types/media'
import { MediaDetailsModal } from '@/presentation/components/admin/MediaDetailsModal'
import { extractMediaMetadata } from '@/presentation/lib/extractMediaMetadata'

interface MediaObject {
  key: string
  size: number
  lastModified: string
  publicUrl: string
  mediaType: 'image' | 'video' | 'other'
  usedIn: AssociationInfo[]
  metadata?: MediaMetadata | null
}

type Tab = 'all' | 'cover' | 'gallery' | 'services' | 'bank'
type AssocFilter = { entityType: 'project' | 'service'; title: string } | 'unassigned' | null

const TAB_PREFIXES: Partial<Record<Tab, string>> = {
  cover: 'projects/cover',
  gallery: 'projects/gallery',
  services: 'services',
}

const TAG_COLORS = [
  '#E2C063', '#7EC8A4', '#7EB8E2', '#E27E7E', '#C27EE2',
  '#E2A87E', '#7EE2D4', '#A8E27E',
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// ─── Media metadata edit modal ──────────────────────────────────────────────

interface MetaEditModalProps {
  item: MediaObject
  folders: MediaFolder[]
  tags: MediaTag[]
  onSave: (patch: Partial<MediaMetadata>) => void
  onClose: () => void
}

function MetaEditModal({ item, folders, tags, onSave, onClose }: MetaEditModalProps) {
  const meta = item.metadata
  const [folderId, setFolderId] = useState<string>(meta?.folderId ?? '')
  const [selectedTags, setSelectedTags] = useState<string[]>(meta?.tags ?? [])
  const [notes, setNotes] = useState<string>(meta?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const toggleTag = (name: string) =>
    setSelectedTags((prev) => prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name])

  const handleSave = async () => {
    setSaving(true)
    try {
      const patch: Partial<MediaMetadata> = {
        folderId: folderId || null,
        tags: selectedTags,
        notes: notes || null,
      }
      await fetch('/api/admin/media/metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: item.key, ...patch }),
      })
      onSave(patch)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative rounded-2xl w-full max-w-md"
        style={{ backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}>
          <h2 className="text-base font-semibold" style={{ color: '#E8DCC4', fontFamily: 'var(--font-cormorant)' }}>
            Edit Media Metadata
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#A89E8C' }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Preview */}
          <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ height: 140, backgroundColor: '#150F0A' }}>
            {item.mediaType === 'image' ? (
              <img src={item.publicUrl} alt="" className="h-full w-full object-contain" />
            ) : item.mediaType === 'video' ? (
              <Film size={32} style={{ color: '#A89E8C' }} />
            ) : (
              <Image size={32} style={{ color: '#A89E8C' }} />
            )}
          </div>

          {/* Folder */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Folder</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)', color: '#E8DCC4' }}
            >
              <option value="">— No folder —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} style={{ backgroundColor: '#1E1A16' }}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Tags</label>
            {tags.length === 0 ? (
              <p className="text-xs" style={{ color: '#6B6560' }}>No tags yet — create some in the Bank tab.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const active = selectedTags.includes(t.name)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.name)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? `${t.color}22` : 'rgba(107,101,96,0.15)',
                        border: `1px solid ${active ? t.color : 'rgba(107,101,96,0.3)'}`,
                        color: active ? t.color : '#A89E8C',
                      }}
                    >
                      {active && <Check size={10} strokeWidth={3} />}
                      {t.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)', color: '#E8DCC4' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(226,192,99,0.1)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: '#A89E8C' }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bank sidebar (folders + tags) ──────────────────────────────────────────

interface BankSidebarProps {
  folders: MediaFolder[]
  tags: MediaTag[]
  selectedFolderId: string | null
  selectedTagNames: string[]
  onSelectFolder: (id: string | null) => void
  onToggleTag: (name: string) => void
  onCreateFolder: (name: string) => void
  onDeleteFolder: (id: string) => void
  onCreateTag: (name: string, color: string) => void
  onDeleteTag: (id: string) => void
  items: MediaObject[]
}

function BankSidebar({
  folders, tags, selectedFolderId, selectedTagNames,
  onSelectFolder, onToggleTag, onCreateFolder, onDeleteFolder,
  onCreateTag, onDeleteTag, items,
}: BankSidebarProps) {
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [creatingTag, setCreatingTag] = useState(false)
  const [foldersExpanded, setFoldersExpanded] = useState(true)
  const [tagsExpanded, setTagsExpanded] = useState(true)

  const unfiledCount = items.filter((i) => !i.metadata?.folderId).length

  const submitFolder = () => {
    if (!newFolderName.trim()) return
    onCreateFolder(newFolderName.trim())
    setNewFolderName('')
    setCreatingFolder(false)
  }

  const submitTag = () => {
    if (!newTagName.trim()) return
    onCreateTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setCreatingTag(false)
  }

  return (
    <aside
      className="flex-shrink-0 rounded-xl p-3 space-y-1 overflow-y-auto"
      style={{ width: 220, backgroundColor: 'rgba(226,192,99,0.04)', border: '1px solid rgba(226,192,99,0.1)' }}
    >
      {/* FOLDERS */}
      <button
        type="button"
        onClick={() => setFoldersExpanded((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[9px] uppercase tracking-widest"
        style={{ color: '#A89E8C' }}
      >
        {foldersExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Folders
      </button>

      {foldersExpanded && (
        <>
          {/* All */}
          <FolderRow
            label="All media"
            count={items.length}
            active={selectedFolderId === null}
            icon={<LayoutGrid size={13} />}
            onClick={() => onSelectFolder(null)}
          />
          {/* Unfiled */}
          <FolderRow
            label="Unfiled"
            count={unfiledCount}
            active={selectedFolderId === 'unfiled'}
            icon={<Folder size={13} />}
            onClick={() => onSelectFolder('unfiled')}
          />
          {folders.map((f) => (
            <FolderRow
              key={f.id}
              label={f.name}
              count={items.filter((i) => i.metadata?.folderId === f.id).length}
              active={selectedFolderId === f.id}
              icon={selectedFolderId === f.id ? <FolderOpen size={13} /> : <Folder size={13} />}
              onClick={() => onSelectFolder(f.id)}
              onDelete={() => onDeleteFolder(f.id)}
            />
          ))}

          {creatingFolder ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitFolder(); if (e.key === 'Escape') setCreatingFolder(false) }}
                placeholder="Folder name…"
                className="flex-1 text-xs px-2 py-1 rounded outline-none min-w-0"
                style={{ backgroundColor: 'rgba(226,192,99,0.1)', color: '#E8DCC4', border: '1px solid rgba(226,192,99,0.25)' }}
              />
              <button onClick={submitFolder} className="p-1 rounded" style={{ color: '#E2C063' }}><Check size={12} /></button>
              <button onClick={() => setCreatingFolder(false)} className="p-1 rounded" style={{ color: '#A89E8C' }}><X size={12} /></button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingFolder(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors"
              style={{ color: '#6B6560' }}
            >
              <Plus size={12} /> New Folder
            </button>
          )}
        </>
      )}

      <div className="my-2" style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} />

      {/* TAGS */}
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
                <div key={t.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleTag(t.name)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                    style={{
                      backgroundColor: active ? `${t.color}22` : 'rgba(107,101,96,0.12)',
                      border: `1px solid ${active ? t.color : 'rgba(107,101,96,0.25)'}`,
                      color: active ? t.color : '#A89E8C',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    {t.name} ({count})
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTag(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                    style={{ color: '#e87070' }}
                    title="Delete tag"
                  >
                    <X size={9} />
                  </button>
                </div>
              )
            })}
          </div>

          {creatingTag ? (
            <div className="px-2 py-1 space-y-1.5">
              <input
                autoFocus
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitTag(); if (e.key === 'Escape') setCreatingTag(false) }}
                placeholder="Tag name…"
                className="w-full text-xs px-2 py-1 rounded outline-none"
                style={{ backgroundColor: 'rgba(226,192,99,0.1)', color: '#E8DCC4', border: '1px solid rgba(226,192,99,0.25)' }}
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
                <button onClick={submitTag} className="flex-1 text-xs py-1 rounded font-medium" style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}>Create</button>
                <button onClick={() => setCreatingTag(false)} className="flex-1 text-xs py-1 rounded" style={{ color: '#A89E8C', border: '1px solid rgba(107,101,96,0.2)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingTag(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ color: '#6B6560' }}
            >
              <Tag size={12} /> New Tag
            </button>
          )}
        </>
      )}
    </aside>
  )
}

function FolderRow({
  label, count, active, icon, onClick, onDelete,
}: {
  label: string; count: number; active: boolean; icon: React.ReactNode; onClick: () => void; onDelete?: () => void
}) {
  return (
    <div className="group flex items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150 min-w-0"
        style={active ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#E2C063' } : { color: '#6B6560' }}
      >
        <span className="flex-shrink-0" style={{ color: active ? '#E2C063' : '#A89E8C' }}>{icon}</span>
        <span className="text-xs font-medium truncate flex-1">{label}</span>
        <span
          className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: active ? 'rgba(226,192,99,0.2)' : 'rgba(107,101,96,0.15)', color: active ? '#E2C063' : '#A89E8C' }}
        >
          {count}
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded flex-shrink-0 transition-opacity"
          style={{ color: '#e87070' }}
          title="Delete folder"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

// ─── Main MediaLibrary component ─────────────────────────────────────────────

export function MediaLibrary() {
  const [tab, setTab] = useState<Tab>('all')
  const [items, setItems] = useState<MediaObject[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [uploadingName, setUploadingName] = useState<string | null>(null)
  const [assocFilter, setAssocFilter] = useState<AssocFilter>(null)
  const [detailItem, setDetailItem] = useState<MediaObject | null>(null)
  const [editMetaItem, setEditMetaItem] = useState<MediaObject | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bank-specific state
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [tags, setTags] = useState<MediaTag[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([])

  const loadMedia = useCallback(async () => {
    setLoading(true)
    setAssocFilter(null)
    try {
      const prefix = TAB_PREFIXES[tab]
      const base = prefix ? `/api/admin/media?prefix=${encodeURIComponent(prefix)}` : '/api/admin/media'
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
    if (fRes.ok) setFolders(await fRes.json())
    if (tRes.ok) setTags(await tRes.json())
  }, [])

  useEffect(() => { loadMedia() }, [loadMedia])
  useEffect(() => { if (tab === 'bank') loadBank() }, [tab, loadBank])

  // Association sidebar derived data
  const projectEntries = Array.from(
    new Map(
      items.flatMap((i) =>
        (i.usedIn ?? []).filter((a) => a.entityType === 'project').map((a) => [a.title, a] as [string, AssociationInfo])
      )
    ).values()
  )
  const serviceEntries = Array.from(
    new Map(
      items.flatMap((i) =>
        (i.usedIn ?? []).filter((a) => a.entityType === 'service').map((a) => [a.title, a] as [string, AssociationInfo])
      )
    ).values()
  )
  const hasUnassigned = items.some((i) => (i.usedIn ?? []).length === 0)

  // Filtered items for standard tabs
  const visibleItemsStandard =
    assocFilter === null
      ? items
      : assocFilter === 'unassigned'
      ? items.filter((i) => (i.usedIn ?? []).length === 0)
      : items.filter((i) =>
          (i.usedIn ?? []).some((a) => a.title === (assocFilter as { title: string }).title)
        )

  // Filtered items for bank tab
  const visibleItemsBank = items.filter((i) => {
    const meta = i.metadata
    const folderOk =
      selectedFolderId === null
        ? true
        : selectedFolderId === 'unfiled'
        ? !meta?.folderId
        : meta?.folderId === selectedFolderId
    const tagsOk =
      selectedTagNames.length === 0
        ? true
        : selectedTagNames.every((t) => meta?.tags?.includes(t))
    return folderOk && tagsOk
  })

  async function handleDelete(key: string) {
    if (!confirm(`Delete "${key}"? This cannot be undone.`)) return
    setDeletingKey(key)
    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      setItems((prev) => prev.filter((i) => i.key !== key))
    } finally {
      setDeletingKey(null)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const prefix = TAB_PREFIXES[tab] ?? 'projects/gallery'
    setUploadingName(file.name)

    try {
      // Extract metadata before upload
      const meta = await extractMediaMetadata(file)

      const presignRes = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, filename: file.name, contentType: file.type }),
      })
      if (!presignRes.ok) { alert('Failed to get upload URL'); return }
      const { presignedUrl, key } = await presignRes.json()
      await fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

      // Save metadata to DB
      if (Object.keys(meta).length > 0) {
        await fetch('/api/admin/media/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, ...meta }),
        })
      }

      await loadMedia()
    } finally {
      setUploadingName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleCreateFolder(name: string) {
    const res = await fetch('/api/admin/media/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const folder = await res.json()
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm('Delete this folder? Media inside will become unfiled.')) return
    await fetch('/api/admin/media/folders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (selectedFolderId === id) setSelectedFolderId(null)
    // Clear folderId from local metadata state
    setItems((prev) =>
      prev.map((i) =>
        i.metadata?.folderId === id ? { ...i, metadata: { ...i.metadata!, folderId: null } } : i
      )
    )
  }

  async function handleCreateTag(name: string, color: string) {
    const res = await fetch('/api/admin/media/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    if (res.ok) {
      const tag = await res.json()
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  async function handleDeleteTag(id: string) {
    if (!confirm('Delete this tag? It will be removed from all media.')) return
    const tag = tags.find((t) => t.id === id)
    await fetch('/api/admin/media/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setTags((prev) => prev.filter((t) => t.id !== id))
    if (tag) setSelectedTagNames((prev) => prev.filter((t) => t !== tag.name))
  }

  function handleMetaSaved(key: string, patch: Partial<MediaMetadata>) {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? { ...i, metadata: { ...(i.metadata ?? { id: '', key, tags: [], folderId: null, notes: null, width: null, height: null, duration: null, format: null }), ...patch } }
          : i
      )
    )
    setEditMetaItem(null)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'cover', label: 'Cover Images' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'services', label: 'Services' },
    { key: 'bank', label: 'Bank' },
  ]

  const hasSidebar = tab !== 'bank' && (projectEntries.length > 0 || serviceEntries.length > 0 || hasUnassigned)

  const visibleItems = tab === 'bank' ? visibleItemsBank : visibleItemsStandard

  return (
    <>
      <div className="space-y-6">
        {/* Tabs + Upload */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
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
              disabled={!!uploadingName}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
            >
              <Upload size={15} />
              {uploadingName ? `Uploading ${uploadingName}…` : 'Upload New'}
            </button>
          </div>
        </div>

        {/* Active tag filters strip (Bank tab) */}
        {tab === 'bank' && selectedTagNames.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: '#A89E8C' }}>Filtering by:</span>
            {selectedTagNames.map((name) => {
              const t = tags.find((tg) => tg.name === name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedTagNames((prev) => prev.filter((n) => n !== name))}
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: `${t?.color ?? '#E2C063'}22`, border: `1px solid ${t?.color ?? '#E2C063'}`, color: t?.color ?? '#E2C063' }}
                >
                  {name} <X size={10} />
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setSelectedTagNames([])}
              className="text-xs underline"
              style={{ color: '#A89E8C' }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex gap-5">
          {/* Bank sidebar */}
          {tab === 'bank' && !loading && (
            <BankSidebar
              folders={folders}
              tags={tags}
              selectedFolderId={selectedFolderId}
              selectedTagNames={selectedTagNames}
              onSelectFolder={setSelectedFolderId}
              onToggleTag={(name) => setSelectedTagNames((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
              items={items}
            />
          )}

          {/* Association sidebar (non-bank tabs) */}
          {hasSidebar && !loading && (
            <aside
              className="flex-shrink-0 rounded-xl p-3 space-y-1"
              style={{ width: 210, backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.1)' }}
            >
              <FolderRow
                label="All media"
                count={items.length}
                active={assocFilter === null}
                onClick={() => setAssocFilter(null)}
                icon={<LayoutGrid size={13} />}
              />
              {hasUnassigned && (
                <FolderRow
                  label="Unassigned"
                  count={items.filter((i) => (i.usedIn ?? []).length === 0).length}
                  active={assocFilter === 'unassigned'}
                  onClick={() => setAssocFilter('unassigned')}
                  icon={<Folder size={13} />}
                />
              )}
              {projectEntries.length > 0 && (
                <>
                  <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>Projects</p>
                  {projectEntries.map((a) => (
                    <FolderRow
                      key={a.title}
                      label={a.title}
                      count={items.filter((i) => (i.usedIn ?? []).some((u) => u.title === a.title)).length}
                      active={assocFilter !== null && assocFilter !== 'unassigned' && (assocFilter as { title: string }).title === a.title}
                      onClick={() => setAssocFilter({ entityType: 'project', title: a.title })}
                      icon={assocFilter !== null && assocFilter !== 'unassigned' && (assocFilter as { title: string }).title === a.title ? <FolderOpen size={13} /> : <Folder size={13} />}
                    />
                  ))}
                </>
              )}
              {serviceEntries.length > 0 && (
                <>
                  <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>Services</p>
                  {serviceEntries.map((a) => (
                    <FolderRow
                      key={a.title}
                      label={a.title}
                      count={items.filter((i) => (i.usedIn ?? []).some((u) => u.title === a.title)).length}
                      active={assocFilter !== null && assocFilter !== 'unassigned' && (assocFilter as { title: string }).title === a.title}
                      onClick={() => setAssocFilter({ entityType: 'service', title: a.title })}
                      icon={assocFilter !== null && assocFilter !== 'unassigned' && (assocFilter as { title: string }).title === a.title ? <FolderOpen size={13} /> : <Folder size={13} />}
                    />
                  ))}
                </>
              )}
            </aside>
          )}

          {/* Media grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: '4/3', backgroundColor: 'rgba(226,192,99,0.08)' }} />
                ))}
              </div>
            ) : visibleItems.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-24 rounded-xl"
                style={{ border: '1px dashed rgba(226,192,99,0.2)', color: '#A89E8C' }}
              >
                <LayoutGrid size={32} className="mb-3 opacity-40" />
                <p className="text-sm">
                  {tab === 'bank'
                    ? selectedFolderId || selectedTagNames.length > 0
                      ? 'No media matches the current filters.'
                      : 'No media found. Upload files to get started.'
                    : assocFilter !== null
                    ? 'No media in this folder.'
                    : 'No media found in this section.'}
                </p>
                {tab !== 'bank' && assocFilter === null && (
                  <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-sm underline" style={{ color: '#E2C063' }}>
                    Upload your first file
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
                {visibleItems.map((item) => (
                  <MediaCard
                    key={item.key}
                    item={item}
                    tags={tags}
                    deleting={deletingKey === item.key}
                    onInfo={() => setDetailItem(item)}
                    onEdit={() => setEditMetaItem(item)}
                    onDelete={() => handleDelete(item.key)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailItem && <MediaDetailsModal item={detailItem} onClose={() => setDetailItem(null)} />}
      {editMetaItem && (
        <MetaEditModal
          item={editMetaItem}
          folders={folders}
          tags={tags}
          onSave={(patch) => handleMetaSaved(editMetaItem.key, patch)}
          onClose={() => setEditMetaItem(null)}
        />
      )}
    </>
  )
}

// ─── Media card ──────────────────────────────────────────────────────────────

function MediaCard({
  item, tags, deleting, onInfo, onEdit, onDelete,
}: {
  item: MediaObject
  tags: MediaTag[]
  deleting: boolean
  onInfo: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const itemTags = (item.metadata?.tags ?? [])
    .map((name) => tags.find((t) => t.name === name))
    .filter(Boolean) as MediaTag[]

  return (
    <div
      className="group relative rounded-xl overflow-hidden"
      style={{ backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.1)' }}
    >
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

        {/* Type badge for videos */}
        {item.mediaType === 'video' && (
          <span className="absolute top-2 left-2 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(226,192,99,0.2)', color: '#E2C063' }}>
            Video
          </span>
        )}

        {/* Action buttons — visible on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onInfo}
            className="p-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063' }}
            title="Details"
          >
            <Info size={11} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063' }}
            title="Edit metadata"
          >
            <Pencil size={11} />
          </button>
        </div>

        {/* Bottom overlay: filename, size, delete */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'linear-gradient(to top, rgba(30,26,22,0.92) 0%, transparent 55%)' }}
        >
          <p className="text-[10px] truncate mb-0.5" style={{ color: '#E8DCC4' }}>{item.key.split('/').pop()}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px]" style={{ color: '#A89E8C' }}>{formatBytes(item.size)}</p>
            {item.metadata?.width != null && item.metadata?.height != null && (
              <p className="text-[10px]" style={{ color: '#6B6560' }}>
                {item.metadata.width}×{item.metadata.height}
              </p>
            )}
          </div>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="absolute top-2 left-2 p-1.5 rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(232,112,112,0.18)', color: '#e87070' }}
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Tag chips — always visible below thumbnail */}
      {itemTags.length > 0 && (
        <div className="px-2 py-1.5 flex flex-wrap gap-1">
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
