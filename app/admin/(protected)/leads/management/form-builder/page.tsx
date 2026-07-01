'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Copy, Trash2, ExternalLink, FileText, Clock } from 'lucide-react'

interface FormListItem {
  id: string
  name: string
  slug: string
  versionCount: number
  latestVersionAt: string | null
}

const SYSTEM_SLUGS = ['request-a-quote']

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatDate(iso: string | null) {
  if (!iso) return 'No versions yet'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(iso),
  )
}

export default function FormBuilderPage() {
  const router = useRouter()
  const [forms, setForms] = useState<FormListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlugOverride, setCreateSlugOverride] = useState('')
  const [createSlugManual, setCreateSlugManual] = useState(false)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const createNameRef = useRef<HTMLInputElement>(null)
  const createSlug = createSlugManual ? createSlugOverride : slugify(createName)

  // Duplicate dialog state
  const [dupSource, setDupSource] = useState<FormListItem | null>(null)
  const [dupName, setDupName] = useState('')
  const [dupSlugOverride, setDupSlugOverride] = useState('')
  const [dupSlugManual, setDupSlugManual] = useState(false)
  const [dupError, setDupError] = useState('')
  const [duping, setDuping] = useState(false)
  const dupNameRef = useRef<HTMLInputElement>(null)
  const dupSlug = useMemo(() => dupSlugManual ? dupSlugOverride : slugify(dupName), [dupSlugManual, dupSlugOverride, dupName])

  // Delete confirmation per-card
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadForms() {
    try {
      const res = await fetch('/api/admin/forms')
      if (res.ok) setForms(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForms()
  }, [])

  // Focus first input when dialogs open
  useEffect(() => {
    if (createOpen) setTimeout(() => createNameRef.current?.focus(), 50)
  }, [createOpen])
  useEffect(() => {
    if (dupSource) setTimeout(() => dupNameRef.current?.focus(), 50)
  }, [dupSource])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), slug: createSlug }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCreateError(json.error || 'Something went wrong')
        return
      }
      setCreateOpen(false)
      setCreateName('')
      setCreateSlugOverride('')
      setCreateSlugManual(false)
      router.push(`/admin/leads/management/form-builder/${json.slug}/builder`)
    } finally {
      setCreating(false)
    }
  }

  async function handleDuplicate(e: React.FormEvent) {
    e.preventDefault()
    if (!dupSource) return
    setDupError('')
    setDuping(true)
    try {
      const res = await fetch(`/api/admin/forms/${dupSource.slug}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: dupName.trim(), slug: dupSlug }),
      })
      const json = await res.json()
      if (!res.ok) {
        setDupError(json.error || 'Something went wrong')
        return
      }
      setDupSource(null)
      setDupName('')
      setDupSlugOverride('')
      setDupSlugManual(false)
      await loadForms()
    } finally {
      setDuping(false)
    }
  }

  async function handleDelete(slug: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/forms/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteConfirmSlug(null)
        await loadForms()
      }
    } finally {
      setDeleting(false)
    }
  }

  function openDuplicate(form: FormListItem) {
    setDupSource(form)
    setDupName(`Copy of ${form.name}`)
    setDupSlugOverride(slugify(`copy-of-${form.slug}`))
    setDupSlugManual(true)
    setDupError('')
  }

  const dialogBackdrop: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  }
  const dialogBox: React.CSSProperties = {
    background: '#fff',
    borderRadius: 14,
    padding: '2rem',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.15 }}
            className="text-fluid-4xl font-semibold"
          >
            Form Builder
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560', maxWidth: '52ch' }}>
            Create and manage reusable forms. Embed them on service pages or open via modal.
          </p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setCreateError('') }}
          style={{
            background: '#E2C063',
            color: '#2D2924',
            border: 'none',
            borderRadius: 8,
            padding: '0.65rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Plus size={16} />
          Create New Form
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: '#6B6560', fontSize: '0.875rem' }}>Loading forms…</div>
      ) : forms.length === 0 ? (
        <div
          style={{
            border: '2px dashed #E5DDD0',
            borderRadius: 12,
            padding: '3rem',
            textAlign: 'center',
            color: '#6B6560',
          }}
        >
          <FileText size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <p style={{ fontWeight: 600, color: '#2D2924', marginBottom: 4 }}>No forms yet</p>
          <p style={{ fontSize: '0.875rem' }}>Click &ldquo;Create New Form&rdquo; to get started.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {forms.map((form) => {
            const isSystem = SYSTEM_SLUGS.includes(form.slug)
            const confirmingDelete = deleteConfirmSlug === form.slug
            return (
              <div
                key={form.id}
                style={{
                  background: '#fff',
                  border: '1px solid #E5DDD0',
                  borderRadius: 12,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#2D2924',
                          fontSize: '1rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '18ch',
                        }}
                      >
                        {form.name}
                      </span>
                      {isSystem && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#B89840',
                            border: '1px solid #E2C063',
                            borderRadius: 4,
                            padding: '1px 5px',
                          }}
                        >
                          System
                        </span>
                      )}
                    </div>
                    <code
                      style={{
                        fontSize: '0.7rem',
                        color: '#6B6560',
                        background: '#F5EFE8',
                        padding: '1px 6px',
                        borderRadius: 4,
                        display: 'inline-block',
                        marginTop: 3,
                      }}
                    >
                      {form.slug}
                    </code>
                  </div>
                  {/* Version badge */}
                  <span
                    style={{
                      background: '#E2C063',
                      color: '#2D2924',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: 20,
                      padding: '2px 8px',
                      flexShrink: 0,
                    }}
                  >
                    v{form.versionCount}
                  </span>
                </div>

                {/* Meta */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.75rem',
                    color: '#6B6560',
                  }}
                >
                  <Clock size={12} />
                  {formatDate(form.latestVersionAt)}
                </div>

                {/* Delete confirm */}
                {confirmingDelete && (
                  <div
                    style={{
                      background: '#FFF5F5',
                      border: '1px solid #FECACA',
                      borderRadius: 8,
                      padding: '0.75rem',
                      fontSize: '0.8rem',
                      color: '#991B1B',
                    }}
                  >
                    <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                      Delete &ldquo;{form.name}&rdquo;? This cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setDeleteConfirmSlug(null)}
                        style={{
                          padding: '4px 12px',
                          border: '1px solid #E5DDD0',
                          borderRadius: 6,
                          background: '#fff',
                          color: '#2D2924',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(form.slug)}
                        disabled={deleting}
                        style={{
                          padding: '4px 12px',
                          border: 'none',
                          borderRadius: 6,
                          background: '#DC2626',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: deleting ? 0.6 : 1,
                        }}
                      >
                        {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                  <Link
                    href={`/admin/leads/management/form-builder/${form.slug}/builder`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      background: '#2D2924',
                      color: '#fff',
                      borderRadius: 7,
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      minWidth: 80,
                    }}
                  >
                    Edit <ExternalLink size={12} />
                  </Link>
                  <button
                    onClick={() => openDuplicate(form)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'transparent',
                      border: '1px solid #E5DDD0',
                      borderRadius: 7,
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem',
                      color: '#2D2924',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    <Copy size={12} /> Duplicate
                  </button>
                  {!isSystem && !confirmingDelete && (
                    <button
                      onClick={() => setDeleteConfirmSlug(form.slug)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'transparent',
                        border: '1px solid transparent',
                        borderRadius: 7,
                        padding: '0.5rem 0.5rem',
                        fontSize: '0.8rem',
                        color: '#DC2626',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      {createOpen && (
        <div style={dialogBackdrop} onClick={() => setCreateOpen(false)}>
          <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.6rem',
                fontWeight: 600,
                color: '#2D2924',
                marginBottom: '1.25rem',
              }}
            >
              Create New Form
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2D2924', display: 'block', marginBottom: 4 }}>
                  Form name
                </label>
                <input
                  ref={createNameRef}
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Contact Us"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #E5DDD0',
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2D2924', display: 'block', marginBottom: 4 }}>
                  Slug <span style={{ color: '#6B6560', fontWeight: 400 }}>(lowercase, hyphens only)</span>
                </label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => { setCreateSlugOverride(e.target.value); setCreateSlugManual(true) }}
                  placeholder="e.g. contact-us"
                  required
                  pattern="[a-z0-9-]+"
                  maxLength={150}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #E5DDD0',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {createError && (
                  <p style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: 4 }}>{createError}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    border: '1px solid #E5DDD0',
                    borderRadius: 8,
                    background: '#fff',
                    color: '#2D2924',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '0.6rem 1.25rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#E2C063',
                    color: '#2D2924',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? 'Creating…' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate dialog */}
      {dupSource && (
        <div style={dialogBackdrop} onClick={() => setDupSource(null)}>
          <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.6rem',
                fontWeight: 600,
                color: '#2D2924',
                marginBottom: '0.5rem',
              }}
            >
              Duplicate Form
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#6B6560', marginBottom: '1.25rem' }}>
              Source: <strong style={{ color: '#2D2924' }}>{dupSource.name}</strong>
            </p>
            <form onSubmit={handleDuplicate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2D2924', display: 'block', marginBottom: 4 }}>
                  New form name
                </label>
                <input
                  ref={dupNameRef}
                  type="text"
                  value={dupName}
                  onChange={(e) => setDupName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #E5DDD0',
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2D2924', display: 'block', marginBottom: 4 }}>
                  Slug
                </label>
                <input
                  type="text"
                  value={dupSlug}
                  onChange={(e) => { setDupSlugOverride(e.target.value); setDupSlugManual(true) }}
                  required
                  pattern="[a-z0-9-]+"
                  maxLength={150}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #E5DDD0',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {dupError && (
                  <p style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: 4 }}>{dupError}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setDupSource(null)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    border: '1px solid #E5DDD0',
                    borderRadius: 8,
                    background: '#fff',
                    color: '#2D2924',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={duping}
                  style={{
                    padding: '0.6rem 1.25rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#E2C063',
                    color: '#2D2924',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    opacity: duping ? 0.7 : 1,
                  }}
                >
                  {duping ? 'Duplicating…' : 'Duplicate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
