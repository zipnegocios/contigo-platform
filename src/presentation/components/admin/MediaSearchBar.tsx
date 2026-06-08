'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMediaLibrary } from './MediaLibraryContext'

export function MediaSearchBar() {
  const {
    searchQuery, setSearchQuery,
    filters, setFilters, clearFilters,
    activeFilterCount,
    folders, tags, items,
  } = useMediaLibrary()

  const [expanded, setExpanded] = useState(false)

  const projectTitles = Array.from(
    new Set(items.flatMap((i) => i.usedIn.filter((a) => a.entityType === 'project').map((a) => a.title)))
  )
  const serviceTitles = Array.from(
    new Set(items.flatMap((i) => i.usedIn.filter((a) => a.entityType === 'service').map((a) => a.title)))
  )

  return (
    <div className="space-y-2">
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
            placeholder="Search by name, project, tag…"
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
          <span className="hidden sm:inline">Filters</span>
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
            Clear
          </button>
        )}
      </div>

      {expanded && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ backgroundColor: 'rgba(226,192,99,0.04)', border: '1px solid rgba(226,192,99,0.12)' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Media type */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Type</label>
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
                    {type === 'all' ? 'All' : type === 'image' ? 'Images' : 'Videos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Folder</label>
              <select
                value={filters.folderId ?? ''}
                onChange={(e) => setFilters({ folderId: e.target.value || null })}
                className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.15)', color: '#E8DCC4' }}
              >
                <option value="">All folders</option>
                <option value="unfiled">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id} style={{ backgroundColor: '#1E1A16' }}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Used in */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>Used in</label>
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
                <option value="">All</option>
                {projectTitles.length > 0 && (
                  <optgroup label="Projects">
                    {projectTitles.map((t) => (
                      <option key={t} value={`project::${t}`}>{t}</option>
                    ))}
                  </optgroup>
                )}
                {serviceTitles.length > 0 && (
                  <optgroup label="Services">
                    {serviceTitles.map((t) => (
                      <option key={t} value={`service::${t}`}>{t}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Tags */}
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
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>From</label>
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
              <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#A89E8C' }}>To</label>
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
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
