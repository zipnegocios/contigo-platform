'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X } from 'lucide-react'

interface CategoryRow {
  id: string
  name: string
  slug: string
  isSystem: boolean
}

export function CategoryTable({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function startEdit(cat: CategoryRow) {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to rename')
        return
      }
      setEditingId(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('All projects in this category will be reassigned to "Uncategorized". Continue?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
        return
      }
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'rgba(226, 192, 99, 0.06)', borderBottom: '1px solid rgba(226, 192, 99, 0.12)' }}>
            <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Name</th>
            <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Slug</th>
            <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Type</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr
              key={cat.id}
              style={{
                backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                borderBottom: '1px solid rgba(226, 192, 99, 0.08)',
              }}
            >
              <td className="px-5 py-3" style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>
                {editingId === cat.id ? (
                  <input
                    className="rounded px-2 py-1 text-sm outline-none w-48"
                    style={{
                      border: '1px solid #E2C063',
                      backgroundColor: 'var(--neutral-50)',
                      color: 'var(--neutral-800)',
                    }}
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(cat.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                  />
                ) : (
                  cat.name
                )}
              </td>
              <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--neutral-600)' }}>
                {cat.slug}
              </td>
              <td className="px-5 py-3">
                {cat.isSystem ? (
                  <span
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: 'rgba(226, 192, 99, 0.18)', color: '#B8860B' }}
                  >
                    System
                  </span>
                ) : (
                  <span
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#6B6560' }}
                  >
                    Custom
                  </span>
                )}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2 justify-end">
                  {editingId === cat.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(cat.id)}
                        disabled={loading}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: '#22c55e' }}
                        title="Save"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: '#6B6560' }}
                        title="Cancel"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded transition-colors hover:bg-black/5"
                        style={{ color: 'var(--neutral-600)' }}
                        title="Rename"
                      >
                        <Pencil size={15} />
                      </button>
                      {!cat.isSystem && (
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          disabled={deletingId === cat.id}
                          className="p-1.5 rounded transition-colors hover:bg-red-50"
                          style={{ color: deletingId === cat.id ? '#ccc' : '#e87070' }}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--neutral-600)' }}>
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
