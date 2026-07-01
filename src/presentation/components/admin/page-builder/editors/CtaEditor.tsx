'use client'

import type { CtaBlockData } from '@/types/pageBlocks'

interface CtaEditorProps { data: CtaBlockData; onChange: (data: CtaBlockData) => void }

export function CtaEditor({ data, onChange }: CtaEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }
  const set = <K extends keyof CtaBlockData>(k: K, v: CtaBlockData[K]) => onChange({ ...data, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Title (optional)</label>
        <input type="text" value={data.title ?? ''} onChange={(e) => set('title', e.target.value || undefined)}
          placeholder="CTA heading" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Subtitle (optional)</label>
        <input type="text" value={data.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value || undefined)}
          placeholder="Supporting text" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div className="space-y-2 p-3 rounded-lg" style={{ border: '1px solid #E5DDD0' }}>
        <p className="text-fluid-xs font-semibold" style={{ color: '#A07B2A' }}>Primary Button</p>
        <input type="text" value={data.primaryBtn.label} onChange={(e) => set('primaryBtn', { ...data.primaryBtn, label: e.target.value })}
          placeholder="Button label" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
        <input type="text" value={data.primaryBtn.href} onChange={(e) => set('primaryBtn', { ...data.primaryBtn, href: e.target.value })}
          placeholder="URL (e.g. /#contact)" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div className="space-y-2 p-3 rounded-lg" style={{ border: '1px solid #E5DDD0' }}>
        <p className="text-fluid-xs font-semibold" style={{ color: '#6B6560' }}>Secondary Button (optional)</p>
        <input type="text" value={data.secondaryBtn?.label ?? ''} onChange={(e) => set('secondaryBtn', e.target.value ? { label: e.target.value, href: data.secondaryBtn?.href ?? '' } : undefined)}
          placeholder="Button label" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
        <input type="text" value={data.secondaryBtn?.href ?? ''} onChange={(e) => set('secondaryBtn', data.secondaryBtn ? { ...data.secondaryBtn, href: e.target.value } : undefined)}
          placeholder="URL" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
    </div>
  )
}
