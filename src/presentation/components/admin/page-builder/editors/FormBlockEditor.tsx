'use client'

import { useEffect, useState } from 'react'
import type { FormBlockData } from '@/types/pageBlocks'

interface FormListItem { id: string; name: string; slug: string }

interface Props {
  data: FormBlockData
  onChange: (data: FormBlockData) => void
}

const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
const l = { color: '#6B6560', fontSize: '0.75rem' as const }

export function FormBlockEditor({ data, onChange }: Props) {
  const [forms, setForms] = useState<FormListItem[]>([])

  useEffect(() => {
    fetch('/api/admin/forms')
      .then((r) => (r.ok ? r.json() : []))
      .then(setForms)
      .catch(() => {})
  }, [])

  function set<K extends keyof FormBlockData>(k: K, v: FormBlockData[K]) {
    onChange({ ...data, [k]: v })
  }

  const pillBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '0.4rem 0',
    border: 'none',
    borderRadius: 6,
    background: active ? '#E2C063' : 'transparent',
    color: active ? '#2D2924' : '#6B6560',
    fontWeight: active ? 700 : 500,
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'background 150ms',
  })

  return (
    <div className="space-y-4">
      {/* Form selector */}
      <div>
        <label className="block font-medium mb-1" style={l}>Form</label>
        <select
          value={data.formSlug}
          onChange={(e) => set('formSlug', e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
          style={s}
        >
          {forms.length === 0 && <option value={data.formSlug}>{data.formSlug}</option>}
          {forms.map((f) => (
            <option key={f.id} value={f.slug}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Display mode */}
      <div>
        <label className="block font-medium mb-1" style={l}>Display mode</label>
        <div
          style={{
            display: 'flex',
            background: '#F0EBE3',
            borderRadius: 8,
            border: '1px solid #E5DDD0',
            padding: 2,
          }}
        >
          <button style={pillBtn(data.displayMode === 'inline')} onClick={() => set('displayMode', 'inline')}>
            Inline
          </button>
          <button style={pillBtn(data.displayMode === 'modal')} onClick={() => set('displayMode', 'modal')}>
            Modal
          </button>
        </div>
      </div>

      {/* Modal-only settings */}
      {data.displayMode === 'modal' && (
        <>
          <div>
            <label className="block font-medium mb-1" style={l}>Button label</label>
            <input
              type="text"
              value={data.buttonLabel}
              onChange={(e) => set('buttonLabel', e.target.value)}
              placeholder="Request a Quote"
              className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
              style={s}
            />
          </div>
          <div>
            <label className="block font-medium mb-1" style={l}>Button style</label>
            <div
              style={{
                display: 'flex',
                background: '#F0EBE3',
                borderRadius: 8,
                border: '1px solid #E5DDD0',
                padding: 2,
              }}
            >
              <button style={pillBtn(data.buttonStyle === 'primary')} onClick={() => set('buttonStyle', 'primary')}>
                Primary
              </button>
              <button style={pillBtn(data.buttonStyle === 'secondary')} onClick={() => set('buttonStyle', 'secondary')}>
                Secondary
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
