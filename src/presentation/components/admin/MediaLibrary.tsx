'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Upload, Film, Image, LayoutGrid, Folder, FolderOpen } from 'lucide-react'
import type { AssociationInfo } from '@/types/media'

interface MediaObject {
  key: string
  size: number
  lastModified: string
  publicUrl: string
  mediaType: 'image' | 'video' | 'other'
  usedIn: AssociationInfo[]
}

type Tab = 'all' | 'cover' | 'gallery' | 'video' | 'services'
type FilterEntry = { entityType: 'project' | 'service'; title: string } | 'unassigned' | null

const TAB_PREFIXES: Record<Tab, string | undefined> = {
  all: undefined,
  cover: 'projects/cover',
  gallery: 'projects/gallery',
  video: 'projects/video',
  services: 'services',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function AssociationBadge({ usedIn }: { usedIn: AssociationInfo[] }) {
  if (usedIn.length === 0) {
    return <p className="text-[9px] mt-1 truncate" style={{ color: '#6B6560' }}>Unassigned</p>
  }
  const first = usedIn[0]
  const extra = usedIn.length - 1
  const label = `${first.title} · ${first.field}`
  return (
    <p className="text-[9px] mt-1 truncate" style={{ color: '#E2C063' }} title={usedIn.map(a => `${a.title} (${a.field})`).join(', ')}>
      {label}{extra > 0 ? ` +${extra}` : ''}
    </p>
  )
}

export function MediaLibrary() {
  const [tab, setTab] = useState<Tab>('all')
  const [items, setItems] = useState<MediaObject[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [uploadingName, setUploadingName] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterEntry>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    setActiveFilter(null)
    try {
      const prefix = TAB_PREFIXES[tab]
      const base = prefix ? `/api/admin/media?prefix=${encodeURIComponent(prefix)}` : '/api/admin/media'
      const res = await fetch(`${base}&withAssociations=1`)
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { loadMedia() }, [loadMedia])

  // Build sidebar entries from loaded items
  const projectEntries = Array.from(
    new Map(
      items.flatMap((i) =>
        i.usedIn
          .filter((a) => a.entityType === 'project')
          .map((a) => [a.title, a] as [string, AssociationInfo])
      )
    ).values()
  )
  const serviceEntries = Array.from(
    new Map(
      items.flatMap((i) =>
        i.usedIn
          .filter((a) => a.entityType === 'service')
          .map((a) => [a.title, a] as [string, AssociationInfo])
      )
    ).values()
  )
  const hasUnassigned = items.some((i) => i.usedIn.length === 0)

  // Apply active filter to visible items
  const visibleItems =
    activeFilter === null
      ? items
      : activeFilter === 'unassigned'
      ? items.filter((i) => i.usedIn.length === 0)
      : items.filter((i) =>
          i.usedIn.some(
            (a) =>
              a.title === (activeFilter as Exclude<FilterEntry, null | 'unassigned'>).title
          )
        )

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
    const isVideo = file.type.startsWith('video/')

    setUploadingName(file.name)
    try {
      const presignRes = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: isVideo ? 'projects/video' : prefix,
          filename: file.name,
          contentType: file.type,
        }),
      })
      if (!presignRes.ok) { alert('Failed to get upload URL'); return }
      const { presignedUrl } = await presignRes.json()
      await fetch(presignedUrl, { method: 'PUT', body: file })
      await loadMedia()
    } finally {
      setUploadingName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'cover', label: 'Cover Images' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'video', label: 'Videos' },
    { key: 'services', label: 'Services' },
  ]

  const isSidebarEntry = (f: FilterEntry, title: string) =>
    f !== null && f !== 'unassigned' && (f as Exclude<FilterEntry, null | 'unassigned'>).title === title

  const hasSidebar = projectEntries.length > 0 || serviceEntries.length > 0 || hasUnassigned

  return (
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
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

      {/* Body: sidebar + grid */}
      <div className="flex gap-5">
        {/* Virtual folder sidebar */}
        {hasSidebar && !loading && (
          <aside
            className="flex-shrink-0 rounded-xl p-3 space-y-1"
            style={{ width: 210, backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.1)' }}
          >
            <SidebarItem
              label="All media"
              count={items.length}
              active={activeFilter === null}
              onClick={() => setActiveFilter(null)}
              icon={<LayoutGrid size={13} />}
            />

            {hasUnassigned && (
              <SidebarItem
                label="Unassigned"
                count={items.filter((i) => i.usedIn.length === 0).length}
                active={activeFilter === 'unassigned'}
                onClick={() => setActiveFilter('unassigned')}
                icon={<Folder size={13} />}
              />
            )}

            {projectEntries.length > 0 && (
              <>
                <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>
                  Projects
                </p>
                {projectEntries.map((a) => (
                  <SidebarItem
                    key={a.title}
                    label={a.title}
                    count={items.filter((i) => i.usedIn.some((u) => u.title === a.title)).length}
                    active={isSidebarEntry(activeFilter, a.title)}
                    onClick={() => setActiveFilter({ entityType: 'project', title: a.title })}
                    icon={isSidebarEntry(activeFilter, a.title) ? <FolderOpen size={13} /> : <Folder size={13} />}
                  />
                ))}
              </>
            )}

            {serviceEntries.length > 0 && (
              <>
                <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>
                  Services
                </p>
                {serviceEntries.map((a) => (
                  <SidebarItem
                    key={a.title}
                    label={a.title}
                    count={items.filter((i) => i.usedIn.some((u) => u.title === a.title)).length}
                    active={isSidebarEntry(activeFilter, a.title)}
                    onClick={() => setActiveFilter({ entityType: 'service', title: a.title })}
                    icon={isSidebarEntry(activeFilter, a.title) ? <FolderOpen size={13} /> : <Folder size={13} />}
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
                {activeFilter !== null ? 'No media in this folder.' : 'No media found in this section.'}
              </p>
              {activeFilter === null && (
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-sm underline" style={{ color: '#E2C063' }}>
                  Upload your first file
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
              {visibleItems.map((item) => (
                <div
                  key={item.key}
                  className="group relative rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.1)' }}
                >
                  {/* Thumbnail */}
                  <div style={{ aspectRatio: '4/3' }}>
                    {item.mediaType === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={36} style={{ color: '#A89E8C' }} />
                      </div>
                    ) : item.mediaType === 'image' ? (
                      <img src={item.publicUrl} alt={item.key} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={36} style={{ color: '#A89E8C' }} />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'linear-gradient(to top, rgba(30,26,22,0.92) 0%, transparent 60%)' }}
                    >
                      <p className="text-[10px] truncate mb-0.5" style={{ color: '#E8DCC4' }}>
                        {item.key.split('/').pop()}
                      </p>
                      <p className="text-[10px]" style={{ color: '#A89E8C' }}>{formatBytes(item.size)}</p>
                      <button
                        onClick={() => handleDelete(item.key)}
                        disabled={deletingKey === item.key}
                        className="absolute top-2 right-2 p-1.5 rounded-full transition-colors"
                        style={{ backgroundColor: 'rgba(232,112,112,0.18)', color: '#e87070' }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Association badge — always visible below thumbnail */}
                  <div className="px-2 py-1.5" style={{ backgroundColor: 'rgba(30,26,22,0.6)' }}>
                    <AssociationBadge usedIn={item.usedIn} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150"
      style={
        active
          ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#E2C063' }
          : { color: '#6B6560' }
      }
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
  )
}
