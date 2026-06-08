'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Film, Loader2, Check, ChevronDown } from 'lucide-react'
import type { AssociationInfo } from '@/types/media'
import type { EntityContext } from './MediaLibraryContext'

interface MediaObject {
  key: string
  size: number
  publicUrl: string
  mediaType: 'image' | 'video' | 'other'
  usedIn?: AssociationInfo[]
}

type Tab = 'all' | 'projects' | 'services' | 'unassigned'
type EntityFilter = { entityType: 'project' | 'service'; title: string } | null

interface MediaPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (publicUrl: string) => void
  onMultiSelect?: (publicUrls: string[]) => void
  multiSelect?: boolean
  allowVideo?: boolean
  entityContext?: EntityContext | null
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'projects', label: 'Projects' },
  { key: 'services', label: 'Services' },
  { key: 'unassigned', label: 'Unassigned' },
]

const FIELDS: Record<string, string> = { cover: 'Cover', gallery: 'Gallery', poster: 'Poster', image: 'Image' }

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  onMultiSelect,
  multiSelect = false,
  allowVideo = false,
  entityContext = null,
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<Tab>('all')
  const [allItems, setAllItems] = useState<MediaObject[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [entityFilter, setEntityFilter] = useState<EntityFilter>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/media?withAssociations=1')
      if (res.ok) {
        const data = await res.json()
        setAllItems(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadMedia()
      setSelectedUrls([])
      setEntityFilter(null)
      setTab('all')
    }
  }, [open, loadMedia])

  useEffect(() => {
    setEntityFilter(null)
  }, [tab])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  // 1. Tab-level filter
  let tabFiltered = allItems
  if (tab === 'projects') {
    tabFiltered = allItems.filter((i) => (i.usedIn ?? []).some((a) => a.entityType === 'project'))
  } else if (tab === 'services') {
    tabFiltered = allItems.filter((i) => (i.usedIn ?? []).some((a) => a.entityType === 'service'))
  } else if (tab === 'unassigned') {
    tabFiltered = allItems.filter((i) => (i.usedIn ?? []).length === 0)
  }

  // 2. Video filter
  const typeFiltered = allowVideo ? tabFiltered : tabFiltered.filter((i) => i.mediaType !== 'video')

  // 3. Entity drill-down filter
  const visibleItems = entityFilter === null
    ? typeFiltered
    : typeFiltered.filter((i) =>
        (i.usedIn ?? []).some(
          (a) => a.entityType === entityFilter.entityType && a.title === entityFilter.title
        )
      )

  // Build entity dropdown options for current tab
  const projectTitles = Array.from(
    new Set(
      tabFiltered.flatMap((i) =>
        (i.usedIn ?? []).filter((a) => a.entityType === 'project').map((a) => a.title)
      )
    )
  )
  const serviceTitles = Array.from(
    new Set(
      tabFiltered.flatMap((i) =>
        (i.usedIn ?? []).filter((a) => a.entityType === 'service').map((a) => a.title)
      )
    )
  )

  const showEntityDropdown = (projectTitles.length > 0 || serviceTitles.length > 0) && tab !== 'unassigned'

  const entityFilterLabel = entityFilter === null
    ? 'All'
    : `${entityFilter.entityType === 'project' ? 'Project' : 'Service'}: ${entityFilter.title}`

  const toggleSelect = (url: string) =>
    setSelectedUrls((prev) => prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url])

  const handleItemClick = (item: MediaObject) => {
    if (multiSelect) {
      toggleSelect(item.publicUrl)
    } else {
      onSelect(item.publicUrl)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(30,26,22,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 860,
          maxHeight: '85vh',
          backgroundColor: '#FAF6F0',
          border: '1px solid rgba(226,192,99,0.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5DDD0' }}
        >
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
            {multiSelect ? 'Select Media' : 'Media Library'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5" style={{ color: '#A89E8C' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs + entity filter row */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 flex-shrink-0 gap-4">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={
                  tab === t.key
                    ? { backgroundColor: '#E2C063', color: '#1E1A16' }
                    : { color: '#6B6560' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Entity drill-down dropdown (only when entities are in this tab) */}
          {showEntityDropdown && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  border: '1px solid #E5DDD0',
                  color: entityFilter ? '#2D2924' : '#A89E8C',
                  backgroundColor: entityFilter ? 'rgba(226,192,99,0.08)' : 'transparent',
                  maxWidth: 220,
                }}
              >
                <span className="truncate">{entityFilterLabel}</span>
                <ChevronDown size={14} className="flex-shrink-0" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[200px]"
                    style={{ backgroundColor: '#FAF6F0', border: '1px solid #E5DDD0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  >
                    <button
                      type="button"
                      onClick={() => { setEntityFilter(null); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-black/5"
                      style={{ color: entityFilter === null ? '#2D2924' : '#6B6560', fontWeight: entityFilter === null ? 600 : 400 }}
                    >
                      All
                    </button>

                    {projectTitles.length > 0 && (
                      <>
                        <p className="px-4 py-1 text-[9px] uppercase tracking-widest" style={{ color: '#A89E8C' }}>Projects</p>
                        {projectTitles.map((title) => (
                          <button
                            key={title}
                            type="button"
                            onClick={() => { setEntityFilter({ entityType: 'project', title }); setDropdownOpen(false) }}
                            className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-black/5 truncate"
                            style={{
                              color: entityFilter?.title === title ? '#2D2924' : '#6B6560',
                              fontWeight: entityFilter?.title === title ? 600 : 400,
                            }}
                          >
                            {title}
                          </button>
                        ))}
                      </>
                    )}

                    {serviceTitles.length > 0 && (
                      <>
                        <p className="px-4 py-1 text-[9px] uppercase tracking-widest" style={{ color: '#A89E8C' }}>Services</p>
                        {serviceTitles.map((title) => (
                          <button
                            key={title}
                            type="button"
                            onClick={() => { setEntityFilter({ entityType: 'service', title }); setDropdownOpen(false) }}
                            className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-black/5 truncate"
                            style={{
                              color: entityFilter?.title === title ? '#2D2924' : '#6B6560',
                              fontWeight: entityFilter?.title === title ? 600 : 400,
                            }}
                          >
                            {title}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6" onClick={() => dropdownOpen && setDropdownOpen(false)}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin" style={{ color: '#E2C063' }} />
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm" style={{ color: '#A89E8C' }}>
                {entityFilter
                  ? `No media found for "${entityFilter.title}".`
                  : tab === 'unassigned'
                  ? 'No unassigned media.'
                  : 'No media found in this section.'}
              </p>
              {!entityFilter && tab === 'all' && (
                <p className="text-xs mt-1" style={{ color: '#C5BDB5' }}>Upload files from the Media Library page first.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {visibleItems.map((item) => {
                const isSelected = selectedUrls.includes(item.publicUrl)
                const isOwn = entityContext && (item.usedIn ?? []).some(
                  (a) => a.entityType === entityContext.type && a.title === entityContext.name
                )
                const firstAssoc = (item.usedIn ?? []).find((a) => !isOwn || a.title !== entityContext?.name)

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="group relative rounded-xl overflow-hidden text-left transition-all duration-150"
                    style={{
                      aspectRatio: '4/3',
                      backgroundColor: '#1E1A16',
                      border: isSelected ? '2px solid #E2C063' : '1px solid rgba(226,192,99,0.12)',
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
                        <Film size={24} style={{ color: '#A89E8C' }} />
                        <span className="text-[8px] uppercase tracking-wider" style={{ color: '#6B6560' }}>File</span>
                      </div>
                    )}

                    {/* Video badge */}
                    {item.mediaType === 'video' && (
                      <span
                        className="absolute bottom-7 right-1.5 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(226,192,99,0.2)', color: '#E2C063' }}
                      >
                        Video
                      </span>
                    )}

                    {/* Multiselect checkmark */}
                    {multiSelect && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150"
                        style={{
                          backgroundColor: isSelected ? '#E2C063' : 'rgba(30,26,22,0.6)',
                          border: isSelected ? 'none' : '1.5px solid rgba(226,192,99,0.5)',
                        }}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} style={{ color: '#1E1A16' }} />}
                      </div>
                    )}

                    {/* Association badge (top strip) */}
                    {isOwn ? (
                      <div
                        className="absolute top-0 left-0 right-0 px-2 py-0.5 flex items-center gap-1"
                        style={{ backgroundColor: 'rgba(82,183,136,0.22)' }}
                      >
                        <Check size={9} strokeWidth={3} style={{ color: '#52B788', flexShrink: 0 }} />
                        <span className="text-[9px] truncate" style={{ color: '#52B788' }}>Already assigned</span>
                      </div>
                    ) : firstAssoc ? (
                      <div
                        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: 'rgba(226,192,99,0.22)', border: '1px solid rgba(226,192,99,0.35)' }}
                      >
                        <span className="text-[8px] truncate max-w-[90px]" style={{ color: '#E2C063' }}>
                          {FIELDS[firstAssoc.field] ?? firstAssoc.field}
                        </span>
                        {(item.usedIn ?? []).length > 1 && (
                          <span className="text-[8px]" style={{ color: '#E2C063' }}>+{(item.usedIn ?? []).length - 1}</span>
                        )}
                      </div>
                    ) : null}

                    {/* Filename on hover */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
                      style={{ backgroundColor: 'rgba(30,26,22,0.88)' }}
                    >
                      <p className="text-[10px] truncate" style={{ color: '#E8DCC4' }}>
                        {item.key.split('/').pop()}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: '1px solid #E5DDD0' }}
        >
          {multiSelect ? (
            <>
              <p className="text-xs" style={{ color: '#A89E8C' }}>
                {selectedUrls.length > 0
                  ? `${selectedUrls.length} item${selectedUrls.length !== 1 ? 's' : ''} selected`
                  : 'Click images to select'}
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={onClose} className="text-sm px-4 py-1.5 rounded-lg" style={{ color: '#6B6560' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { if (onMultiSelect) onMultiSelect(selectedUrls); onClose() }}
                  disabled={selectedUrls.length === 0}
                  className="text-sm px-5 py-1.5 rounded-lg font-semibold disabled:opacity-40"
                  style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
                >
                  Add {selectedUrls.length > 0 ? selectedUrls.length : ''} to gallery
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs" style={{ color: '#A89E8C' }}>
              {visibleItems.length} file{visibleItems.length !== 1 ? 's' : ''} — click any to select
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
