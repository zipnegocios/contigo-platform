'use client'

import { useState, useEffect } from 'react'
import { X, Search, Check, Film, Image as ImageIcon } from 'lucide-react'
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

  const filtered = entities.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
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
        const getRes = await fetch(apiBase)
        const current = getRes.ok ? await getRes.json() : {}
        const currentGallery: GalleryItem[] = current.galleryItems ?? current.galleryUrls ?? []
        const newGalleryItem: GalleryItem = { url: item.publicUrl, order: currentGallery.length }
        body = { galleryItems: [...currentGallery, newGalleryItem] }
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
        style={{ backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--neutral-50)', fontFamily: 'var(--font-cormorant)' }}>
            Assign Media
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--neutral-600)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Preview */}
          <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ height: 100, backgroundColor: '#150F0A' }}>
            {item.mediaType === 'image' ? (
              <img src={item.publicUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <Film size={28} style={{ color: 'var(--neutral-600)' }} />
            )}
          </div>

          {/* Assign as */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: 'var(--neutral-600)' }}>Assign as</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cover', 'gallery'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAssignAs(opt)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                  style={
                    assignAs === opt
                      ? { backgroundColor: 'rgba(226,192,99,0.18)', border: '1.5px solid #E2C063', color: 'var(--contigo-primary)' }
                      : { backgroundColor: 'rgba(226,192,99,0.04)', border: '1px solid rgba(226,192,99,0.15)', color: 'var(--neutral-600)' }
                  }
                >
                  <div className="flex items-center gap-2">
                    {assignAs === opt && <Check size={14} strokeWidth={3} />}
                    {opt === 'cover' ? 'Cover / Hero' : 'Add to Gallery'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: 'var(--neutral-600)' }}>Project / Service</label>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
              style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)' }}
            >
              <Search size={13} style={{ color: 'var(--neutral-600)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--neutral-50)' }}
              />
            </div>

            {loading ? (
              <div className="py-6 text-center text-sm" style={{ color: 'var(--neutral-600)' }}>Loading…</div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {projects.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1.5 px-1" style={{ color: 'var(--neutral-600)' }}>Projects</p>
                    {projects.map((e) => (
                      <EntityRow key={e.id} entity={e} selected={selectedId === e.id} onSelect={() => setSelectedId(e.id)} />
                    ))}
                  </div>
                )}
                {services.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1.5 px-1" style={{ color: 'var(--neutral-600)' }}>Services</p>
                    {services.map((e) => (
                      <EntityRow key={e.id} entity={e} selected={selectedId === e.id} onSelect={() => setSelectedId(e.id)} />
                    ))}
                  </div>
                )}
                {filtered.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: '#6B6560' }}>No results</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(226,192,99,0.1)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--neutral-600)' }}>Cancel</button>
          <button
            onClick={handleAssign}
            disabled={!selectedId || saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
          >
            {saving ? 'Assigning…' : 'Assign'}
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
        border: `1px solid ${selected ? 'var(--contigo-primary)' : 'rgba(226,192,99,0.08)'}`,
        color: selected ? 'var(--contigo-primary)' : 'var(--neutral-50)',
      }}
    >
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ width: 36, height: 36, backgroundColor: '#150F0A' }}
      >
        {entity.coverUrl ? (
          <img src={entity.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={16} style={{ color: 'var(--neutral-600)' }} />
        )}
      </div>
      <span className="flex-1 truncate font-medium">{entity.name}</span>
      {selected && <Check size={14} strokeWidth={3} />}
    </button>
  )
}
