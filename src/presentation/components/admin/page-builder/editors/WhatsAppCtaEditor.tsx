'use client'

import type { WhatsAppCtaBlockData } from '@/types/pageBlocks'

interface WhatsAppCtaEditorProps { data: WhatsAppCtaBlockData; onChange: (data: WhatsAppCtaBlockData) => void }

export function WhatsAppCtaEditor({ data, onChange }: WhatsAppCtaEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }
  const set = <K extends keyof WhatsAppCtaBlockData>(k: K, v: WhatsAppCtaBlockData[K]) => onChange({ ...data, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Phone Number (with country code)</label>
        <input type="tel" value={data.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)}
          placeholder="+61 412 345 678" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Pre-filled Message</label>
        <textarea value={data.message} onChange={(e) => set('message', e.target.value)}
          rows={3} className="w-full px-3 py-2 rounded-lg text-fluid-xs resize-none outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Button Label</label>
        <input type="text" value={data.label} onChange={(e) => set('label', e.target.value)}
          placeholder="Chat on WhatsApp" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Style</label>
        <div className="flex gap-2">
          {(['button', 'banner'] as const).map((style) => (
            <button key={style} type="button" onClick={() => set('style', style)}
              className="flex-1 py-2 rounded-lg text-fluid-xs font-medium capitalize"
              style={data.style === style
                ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1px solid #E2C063' }
                : { ...s }}>
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
