'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FlatCategory, CategoryType, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

interface CategoryFormModalProps {
  mode: 'create' | 'edit'
  type: CategoryType
  allFlat: FlatCategory[]
  editTarget?: FlatCategory | null
  defaultParentId?: string | null
  onClose: () => void
}

function makeSlugPreview(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function getIndentedOptions(flat: FlatCategory[], excludeId?: string): Array<{ id: string; label: string; depth: number }> {
  const result: Array<{ id: string; label: string; depth: number }> = []

  function walk(parentId: string | null, depth: number) {
    const children = flat
      .filter((c) => c.parentId === parentId && c.id !== excludeId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    for (const child of children) {
      result.push({ id: child.id, label: child.name, depth })
      walk(child.id, depth + 1)
    }
  }

  walk(null, 0)
  return result
}

export function CategoryFormModal({
  mode,
  type,
  allFlat,
  editTarget,
  defaultParentId,
  onClose,
}: CategoryFormModalProps) {
  const router = useRouter()
  const [name, setName] = useState(editTarget?.name ?? '')
  const [parentId, setParentId] = useState<string>(editTarget?.parentId ?? defaultParentId ?? '')
  const [description, setDescription] = useState(editTarget?.description ?? '')
  const [icon, setIcon] = useState(editTarget?.icon ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slugPreview = makeSlugPreview(name)
  const options = getIndentedOptions(allFlat, editTarget?.id)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    try {
      if (mode === 'create') {
        const body: CreateCategoryInput = {
          name: name.trim(),
          type,
          parentId: parentId || null,
          description: description.trim() || null,
          icon: icon.trim() || null,
        }
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to create category')
        }
      } else {
        const body: UpdateCategoryInput = {
          name: name.trim(),
          parentId: parentId || null,
          description: description.trim() || null,
          icon: icon.trim() || null,
        }
        const res = await fetch(`/api/admin/categories/${editTarget!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to update category')
        }
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(30,26,22,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl"
        style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5DDD0' }}>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}>
            {mode === 'create' ? 'New Category' : 'Edit Category'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: 'var(--neutral-600)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="Category name"
              autoFocus
            />
            {name && (
              <p className="text-[10px] mt-1" style={{ color: 'var(--neutral-600)' }}>
                Slug: <span className="font-mono">{slugPreview}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>
              Type
            </label>
            <input
              type="text"
              value={type}
              readOnly
              className="w-full px-3 py-2 rounded-lg text-sm capitalize"
              style={{ backgroundColor: 'var(--neutral-200)', color: '#6B6560', border: '1px solid #E5DDD0' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Parent category</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
            >
              <option value="">— None (root category) —</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {'  '.repeat(opt.depth)}{opt.depth > 0 ? '→ ' : ''}{opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Icon (Lucide name)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="e.g. home, building, wrench"
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(232,112,112,0.1)', color: '#e87070' }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg"
              style={{ color: '#6B6560' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50"
              style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
