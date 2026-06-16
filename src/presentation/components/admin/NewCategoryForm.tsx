'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export function NewCategoryForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to create')
        return
      }
      setName('')
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
        style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
      >
        <Plus size={16} />
        New Category
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        autoFocus
        className="rounded-lg px-4 py-2.5 text-sm outline-none"
        style={{
          border: '1px solid #E2C063',
          backgroundColor: 'var(--neutral-50)',
          color: 'var(--neutral-800)',
          minWidth: 200,
        }}
        placeholder="Category name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50"
        style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
      >
        Create
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setName('') }}
        className="px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
        style={{ color: '#6B6560' }}
      >
        Cancel
      </button>
    </form>
  )
}
