'use client'

import { useState, useEffect } from 'react'
import type { FlatCategory, CategoryType } from '@/types/category'
import { getCategoryPath } from '@/lib/buildCategoryTree'

interface HierarchicalCategorySelectProps {
  type: CategoryType
  value: string | null
  onChange: (id: string | null) => void
  label?: string
  required?: boolean
}

interface IndentedOption {
  id: string
  label: string
  depth: number
}

function buildIndentedOptions(flat: FlatCategory[]): IndentedOption[] {
  const result: IndentedOption[] = []
  function walk(parentId: string | null, depth: number) {
    const children = flat
      .filter((c) => c.parentId === parentId && c.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    for (const child of children) {
      result.push({ id: child.id, label: child.name, depth })
      walk(child.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

export function HierarchicalCategorySelect({
  type,
  value,
  onChange,
  label = 'Category',
  required,
}: HierarchicalCategorySelectProps) {
  const [flat, setFlat] = useState<FlatCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/admin/categories/tree?type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setFlat(data.flat ?? [])
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [type])

  const options = buildIndentedOptions(flat)
  const selectedPath = value ? getCategoryPath(flat, value) : []

  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>
        {label}
        {required && ' *'}
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        required={required}
        disabled={loading}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: '#F0EBE3', color: loading ? '#A89E8C' : '#2D2924', border: '1px solid #E5DDD0' }}
      >
        <option value="">{loading ? 'Loading…' : '— No category —'}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {'  '.repeat(opt.depth)}{opt.depth > 0 ? '→ ' : ''}{opt.label}
          </option>
        ))}
      </select>
      {selectedPath.length > 1 && (
        <p className="text-[10px] mt-1" style={{ color: '#A89E8C' }}>
          {selectedPath.map((c) => c.name).join(' › ')}
        </p>
      )}
    </div>
  )
}
