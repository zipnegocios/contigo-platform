'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

interface StaffFormModalProps {
  onClose: () => void
  onCreated: () => void
}

export function StaffFormModal({ onClose, onCreated }: StaffFormModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          title: title.trim() || null,
          phone: phone.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create staff user')
      }

      onCreated()
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
          <h2 className="text-fluid-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}>
            New Staff User
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 min-h-[44px] min-w-[44px]" style={{ color: 'var(--neutral-600)' }}>
            <X className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-fluid-xs font-medium mb-1" style={{ color: '#6B6560' }}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="Full name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-fluid-xs font-medium mb-1" style={{ color: '#6B6560' }}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="staff@contigoconstructions.com.au"
            />
          </div>

          <div>
            <label className="block text-fluid-xs font-medium mb-1" style={{ color: '#6B6560' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="e.g. Project Manager"
            />
          </div>

          <div>
            <label className="block text-fluid-xs font-medium mb-1" style={{ color: '#6B6560' }}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="Optional phone number"
            />
          </div>

          <div>
            <label className="block text-fluid-xs font-medium mb-1" style={{ color: '#6B6560' }}>Initial password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="Set an initial password"
            />
          </div>

          {error && (
            <p className="text-fluid-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(232,112,112,0.1)', color: '#e87070' }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-fluid-sm rounded-lg min-h-[44px]"
              style={{ color: '#6B6560' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !email.trim() || !password}
              className="flex items-center gap-2 px-5 py-2 text-fluid-sm font-semibold rounded-lg disabled:opacity-50 min-h-[44px]"
              style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
            >
              {saving && <Loader2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)] animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
