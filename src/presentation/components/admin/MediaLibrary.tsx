'use client'

import { useRef, useState } from 'react'
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

  const SidebarBtn = ({
    label,
    count,
    active,
    onClick,
  }: { label: string; count: number; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
      style={active ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#E2C063' } : { color: '#6B6560' }}
    >
      <span className="text-xs font-medium truncate flex-1">{label}</span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full"
        style={{
          backgroundColor: active ? 'rgba(226,192,99,0.2)' : 'rgba(107,101,96,0.15)',
          color: active ? '#E2C063' : '#A89E8C',
        }}
      >
        {count}
      </span>
    </button>
  )

  const assocTitle = filters.associatedWith?.title ?? null
  const isUnassigned = filters.folderId === 'unassigned-filter'

  return (
    <aside
      className="flex-shrink-0 rounded-xl p-3 space-y-1"
      style={{ width: 210, backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.1)' }}
    >
      <SidebarBtn
        label="Todos"
        count={items.length}
        active={!assocTitle && !isUnassigned}
        onClick={() => setFilters({ associatedWith: null, folderId: null })}
      />
      {hasUnassigned && (
        <SidebarBtn
          label="Sin asignar"
          count={items.filter((i) => i.usedIn.length === 0).length}
          active={isUnassigned}
          onClick={() => setFilters({ folderId: 'unassigned-filter', associatedWith: null })}
        />
      )}
      {projectEntries.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>
            Proyectos
          </p>
          {projectEntries.map((a) => (
            <SidebarBtn
              key={a.title}
              label={a.title}
              count={items.filter((i) => i.usedIn.some((u) => u.title === a.title)).length}
              active={assocTitle === a.title}
              onClick={() => setFilters({ associatedWith: { entityType: 'project', title: a.title }, folderId: null })}
            />
          ))}
        </>
      )}
      {serviceEntries.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: '#A89E8C' }}>
            Servicios
          </p>
          {serviceEntries.map((a) => (
            <SidebarBtn
              key={a.title}
              label={a.title}
              count={items.filter((i) => i.usedIn.some((u) => u.title === a.title)).length}
              active={assocTitle === a.title}
              onClick={() => setFilters({ associatedWith: { entityType: 'service', title: a.title }, folderId: null })}
            />
          ))}
        </>
      )}
    </aside>
  )
}

// ─── Tab configuration ────────────────────────────────────────────────────────

const TAB_LIST = [
  { key: 'all', label: 'Todos' },
  { key: 'cover', label: 'Portadas' },
  { key: 'gallery', label: 'Galería' },
  { key: 'services', label: 'Servicios' },
  { key: 'bank', label: 'Bank' },
] as const

const TAB_UPLOAD_PREFIX: Record<string, string> = {
  cover: 'projects/cover',
  gallery: 'projects/gallery',
  services: 'services',
  all: 'projects/gallery',
  bank: 'projects/gallery',
}

// ─── Inner orchestrator ───────────────────────────────────────────────────────

function MediaLibraryInner() {
  const { tab, setTab, detailItem, loading, refreshItems } = useMediaLibrary()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const prefix = TAB_UPLOAD_PREFIX[tab] ?? 'projects/gallery'
    setUploading(true)
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
      setUploading(false)
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
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            <Upload size={15} />
            {uploading ? 'Subiendo…' : 'Subir archivo'}
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

// ─── Public export ────────────────────────────────────────────────────────────

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
