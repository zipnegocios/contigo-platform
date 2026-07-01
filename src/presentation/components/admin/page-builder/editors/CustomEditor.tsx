'use client'

import { useState } from 'react'
import type { CustomBlockData } from '@/types/pageBlocks'

interface Props { data: CustomBlockData; onChange: (d: CustomBlockData) => void }

const TABS = ['html', 'css', 'js'] as const
type Tab = typeof TABS[number]

const TAB_LABEL: Record<Tab, string> = { html: 'HTML', css: 'CSS', js: 'JS' }
const TAB_PLACEHOLDER: Record<Tab, string> = {
  html: '<div>\n  <!-- Your HTML here -->\n</div>',
  css:  '/* Your CSS here */',
  js:   '// Your JavaScript here\n// Runs on page load',
}

export function CustomEditor({ data, onChange }: Props) {
  const [tab, setTab] = useState<Tab>('html')

  return (
    <div className="space-y-2">
      <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid #E5DDD0' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-1.5 text-fluid-xs font-semibold transition-all"
            style={{
              backgroundColor: tab === t ? '#2D2924' : '#F5EFE8',
              color: tab === t ? '#E2C063' : '#6B6560',
            }}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <textarea
        value={data[tab]}
        onChange={(e) => onChange({ ...data, [tab]: e.target.value })}
        placeholder={TAB_PLACEHOLDER[tab]}
        rows={14}
        spellCheck={false}
        className="w-full rounded-md p-3 font-mono text-fluid-xs resize-y leading-relaxed"
        style={{
          backgroundColor: '#1E1A16',
          color: tab === 'html' ? '#7DCEA0' : tab === 'css' ? '#85C1E9' : '#F9E79F',
          border: '1px solid #3A3530',
          outline: 'none',
          caretColor: '#E2C063',
        }}
      />

      <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>
        CSS and JS are applied globally. Use specific class names to avoid conflicts.
      </p>
    </div>
  )
}
