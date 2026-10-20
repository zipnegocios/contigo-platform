'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Monitor, Smartphone } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { HeroMediaLayer } from '@/presentation/components/hero/HeroMediaLayer'
import { resolveHeroMedia, type HeroConfigInput } from '@/core/entities/HeroConfig'

interface Props {
  title: string
  snapshot: HeroConfigInput | null
  onClose: () => void
}

const toggleBtn = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, padding: '5px 12px',
  borderRadius: 999, border: 'none', cursor: 'pointer',
  background: active ? '#2D2924' : 'transparent', color: active ? '#FAF6F0' : '#6B6560',
})

/** Approximate (non-interactive) render of a stored hero version, in a desktop or mobile frame. */
export function HeroVersionPreviewDialog({ title, snapshot, onClose }: Props) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => {
    setSlideIdx(0)
    setViewport('desktop')
  }, [snapshot])

  const slider = snapshot?.mode === 'slider' && snapshot.slides.length > 0
  const slide = slider ? snapshot!.slides[slideIdx] : null

  const desktop = snapshot
    ? slide
      ? resolveHeroMedia(slide.desktopMedia, slide.desktopImageUrl || undefined)
      : resolveHeroMedia(snapshot.desktopMedia, snapshot.desktopImageUrl)
    : undefined
  const mobile = snapshot
    ? slide
      ? resolveHeroMedia(slide.mobileMedia, slide.mobileImageUrl)
      : resolveHeroMedia(snapshot.mobileMedia, snapshot.mobileImageUrl)
    : undefined

  const eyebrow = slide?.eyebrow ?? snapshot?.eyebrow
  const headline = slide?.headline ?? snapshot?.headline ?? ''
  const subtitle = slide?.subtitle ?? snapshot?.subtitle
  const buttons = slide?.buttons.length ? slide.buttons : (snapshot?.buttons ?? [])
  const overlay = (snapshot?.overlayOpacity ?? 50) / 100
  const isMobile = viewport === 'mobile'

  return (
    <Dialog open={snapshot !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        {snapshot && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', padding: 3, borderRadius: 999, background: '#EFE8DA' }}>
                <button type="button" style={toggleBtn(!isMobile)} onClick={() => setViewport('desktop')}>
                  <Monitor size={13} /> Desktop
                </button>
                <button type="button" style={toggleBtn(isMobile)} onClick={() => setViewport('mobile')}>
                  <Smartphone size={13} /> Mobile
                </button>
              </div>
              {slider && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#6B6560' }}>
                  <button
                    type="button" aria-label="Previous slide"
                    onClick={() => setSlideIdx((i) => (i - 1 + snapshot.slides.length) % snapshot.slides.length)}
                    style={{ border: '1px solid #E5DDD0', background: '#fff', borderRadius: 6, padding: 3, cursor: 'pointer', display: 'flex' }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  Slide {slideIdx + 1} / {snapshot.slides.length}
                  <button
                    type="button" aria-label="Next slide"
                    onClick={() => setSlideIdx((i) => (i + 1) % snapshot.slides.length)}
                    style={{ border: '1px solid #E5DDD0', background: '#fff', borderRadius: 6, padding: 3, cursor: 'pointer', display: 'flex' }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', background: '#EFE8DA', borderRadius: 10, padding: 16 }}>
              <div
                style={{
                  position: 'relative', overflow: 'hidden', background: '#000', borderRadius: 8,
                  ...(isMobile ? { height: 460, aspectRatio: '9 / 16' } : { width: '100%', aspectRatio: '16 / 9' }),
                }}
              >
                <HeroMediaLayer key={`${viewport}-${slideIdx}`} desktop={desktop} mobile={mobile} viewport={viewport} alt="" />
                <div
                  style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `linear-gradient(to top, rgba(18,14,10,${Math.min(overlay + 0.38, 0.95)}) 0%, rgba(18,14,10,${overlay * 0.8}) 45%, rgba(18,14,10,${overlay * 0.36}) 100%)`,
                  }}
                />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: isMobile ? 16 : 28, color: '#FAF6F0', pointerEvents: 'none' }}>
                  {eyebrow && (
                    <span style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E8D5A3', marginBottom: 6 }}>
                      {eyebrow}
                    </span>
                  )}
                  <p style={{ fontSize: isMobile ? '1.15rem' : '1.7rem', lineHeight: 1.1, whiteSpace: 'pre-line', maxWidth: 520 }}>{headline}</p>
                  {subtitle && (
                    <p style={{ fontSize: '0.7rem', marginTop: 8, maxWidth: 300, color: 'rgba(250,246,240,0.82)', lineHeight: 1.5 }}>{subtitle}</p>
                  )}
                  {buttons.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {buttons.map((b) => (
                        <span
                          key={b.id}
                          style={{
                            fontSize: '0.65rem', fontWeight: 600, padding: '5px 12px', borderRadius: 4,
                            background: b.style === 'primary' ? '#E2C063' : 'transparent',
                            color: b.style === 'primary' ? '#2D2924' : '#E2C063',
                            border: b.style === 'primary' ? '1px solid #E2C063' : '1px solid rgba(226,192,99,0.8)',
                          }}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#6B6560', marginTop: 8 }}>
              Approximate preview: text sizes and animations differ from the live site.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
