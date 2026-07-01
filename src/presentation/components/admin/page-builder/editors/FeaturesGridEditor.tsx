'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { FeaturesGridBlockData } from '@/types/pageBlocks'

interface FeaturesGridEditorProps { data: FeaturesGridBlockData; onChange: (data: FeaturesGridBlockData) => void }

export function FeaturesGridEditor({ data, onChange }: FeaturesGridEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }

  const update = (idx: number, key: keyof FeaturesGridBlockData['features'][0], value: string) => {
    onChange({ features: data.features.map((f, i) => i === idx ? { ...f, [key]: value } : f) })
  }
  const add = () => onChange({ features: [...data.features, { iconName: 'check', title: '', description: '' }] })
  const remove = (idx: number) => onChange({ features: data.features.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {data.features.map((f, idx) => (
        <div key={idx} className="p-3 rounded-lg space-y-2" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between">
            <span className="text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>Feature {idx + 1}</span>
            {data.features.length > 1 && (
              <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50" style={{ color: '#9C8F83' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input type="text" value={f.iconName} onChange={(e) => update(idx, 'iconName', e.target.value)}
            placeholder="Lucide icon name (e.g. check, home, wrench)" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
          <input type="text" value={f.title} onChange={(e) => update(idx, 'title', e.target.value)}
            placeholder="Feature title" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
          <textarea value={f.description} onChange={(e) => update(idx, 'description', e.target.value)}
            rows={2} placeholder="Short description" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs resize-none outline-none" style={s} />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>
        <Plus className="w-3.5 h-3.5" /> Add feature
      </button>
      <p className="text-fluid-xs" style={l}>Use Lucide icon names for the icon field (e.g. check, home, wrench, star).</p>
    </div>
  )
}
