'use client'

import { useState } from 'react'
import { LayoutPanelTop, GalleryHorizontal, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { HeroConfig, HeroConfigInput } from '@/core/entities/HeroConfig'
import { HeroImagePair } from './HeroImagePair'
import { ButtonsManager } from './ButtonsManager'
import { SlidesList } from './SlidesList'

interface EntityOption { id: string; label: string; slug: string; categorySlug?: string }
interface FormOption { id: string; name: string; slug: string }

interface Props {
  initialConfig: HeroConfig | null
  serviceOptions: EntityOption[]
  projectOptions: EntityOption[]
  formOptions: FormOption[]
}

const DEFAULT_CONFIG: HeroConfigInput = {
  mode: 'single',
  headline: 'Building Dreams Together',
  subtitle: "We don't build for you, we build with you. Premium construction services tailored to your vision.",
  eyebrow: 'Adelaide, South Australia',
  desktopImageUrl: '/assets/hero-test1.png',
  mobileImageUrl: undefined,
  buttons: [
    { id: 'btn-1', label: 'Our Services', style: 'secondary', linkType: 'scroll', href: '#services', scrollTarget: 'services' },
    { id: 'btn-2', label: 'Get a Quote', style: 'primary', linkType: 'scroll', href: '#contact', scrollTarget: 'contact' },
  ],
  slides: [],
  autoplayInterval: 5000,
  overlayOpacity: 50,
}

const sectionCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E5DDD0',
  borderRadius: 12,
  padding: '1.5rem',
  marginBottom: '1.5rem',
}

const sectionHeading: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#6B6560',
  marginBottom: '1rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #E5DDD0',
  borderRadius: 6,
  fontSize: '0.875rem',
  color: '#2D2924',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}

export function HeroConfigEditor({ initialConfig, serviceOptions, projectOptions, formOptions }: Props) {
  const [config, setConfig] = useState<HeroConfigInput>(() => {
    if (!initialConfig) return DEFAULT_CONFIG
    const { id: _id, updatedAt: _updatedAt, ...rest } = initialConfig
    return rest
  })
  const [saving, setSaving] = useState(false)

  function patch(partial: Partial<HeroConfigInput>) {
    setConfig((prev) => ({ ...prev, ...partial }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/hero-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Could not save')
        return
      }
      toast.success('Hero section saved')
    } catch {
      toast.error('Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Sticky top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#fff', borderBottom: '1px solid #E5DDD0',
        padding: '12px 0 12px', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: saving ? '#D4AD4B' : '#E2C063',
            color: '#2D2924', fontWeight: 600, fontSize: '0.875rem',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          Save changes
        </button>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
        {([
          { value: 'single' as const, Icon: LayoutPanelTop, title: 'Single Image', desc: 'One background image for the entire hero' },
          { value: 'slider' as const, Icon: GalleryHorizontal, title: 'Image Slider', desc: 'Multiple slides, each with its own image and text' },
        ]).map(({ value, Icon, title, desc }) => (
          <button
            key={value}
            onClick={() => patch({ mode: value })}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 8, padding: '1.25rem', borderRadius: 12, cursor: 'pointer',
              border: `2px solid ${config.mode === value ? '#E2C063' : '#E5DDD0'}`,
              background: config.mode === value ? 'rgba(226,192,99,0.06)' : '#fff',
              textAlign: 'left',
            }}
          >
            <Icon size={24} color={config.mode === value ? '#E2C063' : '#C5B99A'} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2D2924' }}>{title}</span>
            <span style={{ fontSize: '0.8rem', color: '#6B6560', lineHeight: 1.4 }}>{desc}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      {config.mode === 'single' ? (
        <>
          {/* Images */}
          <div style={sectionCard}>
            <p style={sectionHeading}>Images</p>
            <HeroImagePair
              desktopImageUrl={config.desktopImageUrl}
              mobileImageUrl={config.mobileImageUrl}
              onChange={(desktop, mobile) => patch({ desktopImageUrl: desktop, mobileImageUrl: mobile })}
            />
          </div>

          {/* Content */}
          <div style={sectionCard}>
            <p style={sectionHeading}>Content</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Eyebrow (optional)</label>
                <input
                  style={inputStyle}
                  value={config.eyebrow ?? ''}
                  onChange={(e) => patch({ eyebrow: e.target.value || undefined })}
                  placeholder="e.g. Adelaide, South Australia"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Headline</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }}
                  value={config.headline}
                  onChange={(e) => patch({ headline: e.target.value })}
                  placeholder="Main heading"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Subtitle (optional)</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  value={config.subtitle ?? ''}
                  onChange={(e) => patch({ subtitle: e.target.value || undefined })}
                  placeholder="Supporting description text"
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>
                  <span>Overlay opacity</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{config.overlayOpacity}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.overlayOpacity}
                  onChange={(e) => patch({ overlayOpacity: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#E2C063' }}
                />
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div style={sectionCard}>
            <p style={sectionHeading}>Call to Action</p>
            <ButtonsManager
              buttons={config.buttons}
              serviceOptions={serviceOptions}
              projectOptions={projectOptions}
              formOptions={formOptions}
              onChange={(btns) => patch({ buttons: btns })}
            />
          </div>
        </>
      ) : (
        <>
          {/* Slides */}
          <div style={sectionCard}>
            <p style={sectionHeading}>Slides</p>
            <SlidesList
              slides={config.slides}
              onChange={(slides) => patch({ slides })}
              serviceOptions={serviceOptions}
              projectOptions={projectOptions}
              formOptions={formOptions}
            />
          </div>

          {/* Slider settings */}
          <div style={sectionCard}>
            <p style={sectionHeading}>Slider Settings</p>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>
                Autoplay interval <span style={{ fontWeight: 400, color: '#9B918A' }}>(milliseconds)</span>
              </label>
              <input
                type="number"
                min={1000}
                max={30000}
                step={500}
                style={{ ...inputStyle, width: 180 }}
                value={config.autoplayInterval}
                onChange={(e) => patch({ autoplayInterval: Math.max(1000, Math.min(30000, Number(e.target.value))) })}
              />
              <p style={{ fontSize: '0.75rem', color: '#9B918A', marginTop: 4 }}>
                {(config.autoplayInterval / 1000).toFixed(1)}s between slides
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
