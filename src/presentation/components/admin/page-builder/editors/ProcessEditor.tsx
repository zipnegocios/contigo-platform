'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ProcessBlockData } from '@/types/pageBlocks'

interface ProcessEditorProps {
  data: ProcessBlockData
  onChange: (data: ProcessBlockData) => void
}

const inputStyle = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' } as const

export function ProcessEditor({ data, onChange }: ProcessEditorProps) {
  const update = (idx: number, key: 'title' | 'description', value: string) => {
    const steps = data.steps.map((s, i) => i === idx ? { ...s, [key]: value } : s)
    onChange({ steps })
  }

  const add = () => onChange({ steps: [...data.steps, { title: '', description: '' }] })
  const remove = (idx: number) => onChange({ steps: data.steps.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-4">
      {data.steps.map((step, idx) => (
        <div key={idx} className="space-y-2 p-3 rounded-lg" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>Step {idx + 1}</span>
            {data.steps.length > 1 && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-1 rounded hover:bg-red-50"
                style={{ color: '#9C8F83' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            type="text"
            value={step.title}
            onChange={(e) => update(idx, 'title', e.target.value)}
            placeholder="Step title"
            className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
            style={inputStyle}
          />
          <textarea
            value={step.description}
            onChange={(e) => update(idx, 'description', e.target.value)}
            placeholder="Step description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-fluid-xs resize-none outline-none"
            style={inputStyle}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-fluid-xs font-medium transition-all"
        style={{ color: '#A07B2A' }}
      >
        <Plus className="w-3.5 h-3.5" /> Add step
      </button>
    </div>
  )
}
