'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { gsap } from 'gsap'
import { Button } from '@/presentation/design-system/components/atoms'
import { IconLogo } from './IconLogo'
import { logoPaths, LOGO_VIEWBOX } from './logo-paths'
import { SOCIAL_LINKS } from './social-links'
import { NAV_LINKS } from './nav-links'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

// .mnp-logo-flip is 90vw wide (its huge, intro-state size). Shrinking to this
// fraction lands the resting logo at ~30vw -- comparable to the header's own
// compact logo footprint -- while keeping the scale animation strictly <= 1.
const LOGO_REST_SCALE = 1 / 3

interface MobileNavPanelProps {
  open: boolean
  onClose: () => void
  onContactClick: () => void
  onQuoteClick: () => void
}

export function MobileNavPanel({ open, onClose, onContactClick, onQuoteClick }: MobileNavPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const logoStageRef = useRef<HTMLDivElement>(null)
  const logoFlipRef = useRef<HTMLDivElement>(null)
  const navListRef = useRef<HTMLUListElement>(null)
  const socialsRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const prevBodyStyleRef = useRef({ position: '', top: '', width: '', overflow: '' })
  const scrollYRef = useRef(0)

  // NOTE: this is a TRANSIENT inline style toggle on `document.body`, scoped to this
  // component's open/close lifecycle -- NOT a global CSS rule. It is unrelated to, and must
  // never be merged with, the permanent `overflow-x: hidden` rule that lives on `html` in
  // app/globals.css (~line 28). That comment documents a real double-scrollbar bug caused by
  // stacking `overflow-x: hidden` on BOTH html and body permanently in the stylesheet. This
  // effect only ever touches `body`'s inline styles, only while this full-screen panel is open,
  // and always restores body's prior values on cleanup -- it cannot recreate that bug because
  // it's temporary and undoes itself.
  //
  // Plain `overflow: hidden` on body doesn't reliably stop touch-driven scrolling of the
  // content behind a full-screen overlay on mobile Safari (a well-known platform quirk), so
  // this freezes body in place with `position: fixed` at the current scroll offset -- nothing
  // behind the panel can move no matter the input (touch, wheel, keyboard) -- and restores the
  // exact scroll position on close.
  useEffect(() => {
    if (!open) return
    const body = document.body
    scrollYRef.current = window.scrollY
    prevBodyStyleRef.current = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollYRef.current}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      const prev = prevBodyStyleRef.current
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollYRef.current)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!panelRef.current) return

    const ctx = gsap.context(() => {
      const navItems = navListRef.current
        ? Array.from(navListRef.current.querySelectorAll<HTMLLIElement>('.mnp-nav-item'))
        : []

      if (!open) {
        // CLOSE: fast, simple fade -- not a mirrored replay of the open choreography.
        timelineRef.current?.kill()
        gsap.to(panelRef.current, {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.in',
          onComplete: () => {
            // Reset every animatable prop so the NEXT open replays the full intro
            // from scratch (huge/unrotated/invisible logo, hidden nav/socials).
            gsap.set(panelRef.current, { opacity: 1 })
            gsap.set(logoStageRef.current, { opacity: 0 })
            gsap.set(logoFlipRef.current, { scale: 1, rotateY: 0 })
            gsap.set(navItems, { opacity: 0, y: 28 })
            gsap.set(socialsRef.current, { opacity: 0, y: 16 })
          },
        })
        return
      }

      // OPEN
      if (prefersReducedMotion()) {
        // Same pattern as BrandPromiseSection.tsx: skip the elaborate intro,
        // jump straight to end-state.
        gsap.set(panelRef.current, { opacity: 1 })
        gsap.set(logoStageRef.current, { opacity: 1 })
        gsap.set(logoFlipRef.current, { scale: LOGO_REST_SCALE, rotateY: 0 })
        gsap.set(navItems, { opacity: 1, y: 0 })
        gsap.set(socialsRef.current, { opacity: 1, y: 0 })
        return
      }

      // Start state (also covers the very first-ever open, before any close has run).
      // `.mnp-logo-flip`'s own CSS width IS the "huge, dominating" 90vw size (see
      // globals.css) -- scale starts at 1 (its natural, already-huge size) and only
      // ever animates DOWN to LOGO_REST_SCALE. A vector SVG under a 3D transform
      // (perspective + preserve-3d) gets composited on its own GPU layer, which
      // browsers rasterize at the element's current size; scaling that layer UP
      // past 1 (the old approach: small intrinsic size -> scale up to 3.4) stretches
      // an already-rasterized texture and pixelates. Only ever scaling DOWN from an
      // intrinsically-huge element is never blurry.
      gsap.set(panelRef.current, { opacity: 1 })
      gsap.set(logoStageRef.current, { opacity: 0 })
      gsap.set(logoFlipRef.current, { scale: 1, rotateY: 0 })
      gsap.set(navItems, { opacity: 0, y: 28 })
      gsap.set(socialsRef.current, { opacity: 0, y: 16 })

      const tl = gsap.timeline({ paused: true })
      timelineRef.current = tl

      // PHASE 1 -- bicolor panel reveal
      tl.fromTo(panelRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)

      // PHASE 2 -- huge logo fades in (already enormous via the scale set above)
      tl.to(logoStageRef.current, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0.15)

      // PHASE 3 -- multi-rotation rotateY flip ("horizontal-axis" flip per this
      // codebase's .service-flip-inner convention: rotateY = left-right flip,
      // vs rotateX = top-over-bottom), 2.5 full turns, then a springy
      // overshoot-and-settle "bounce" on the final leg (the easing produces the
      // bounce, it isn't a separate discrete step).
      tl.to(logoFlipRef.current, { rotateY: 900, duration: 1.1, ease: 'power2.in' }, 0.15)
      tl.to(logoFlipRef.current, { rotateY: 1080, duration: 0.65, ease: 'back.out(1.7)' }, 1.25)

      // PHASE 4 -- shrink + reposition: huge centered logo -> small top-center
      // resting size, matching the header's own logo footprint. Scaling DOWN
      // (never up) keeps the rasterized 3D layer crisp -- see the comment on
      // LOGO_REST_SCALE above.
      tl.to(logoFlipRef.current, { scale: LOGO_REST_SCALE, duration: 0.55, ease: 'power3.inOut' }, 1.75)

      // PHASE 5 -- nav items stagger in, starting only once the shrink (phase 4,
      // ending at 1.75+0.55=2.30) has fully resolved -- sequential, not overlapped.
      tl.to(navItems, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08 }, 2.3)

      // PHASE 6 -- footer socials reveal, tail end of the nav stagger.
      tl.to(socialsRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.6)

      tl.play(0)
    }, panelRef)

    return () => ctx.revert()
  }, [open])

  return (
    <div
      ref={panelRef}
      className="mnp-panel"
      style={{ visibility: open ? 'visible' : 'hidden' }}
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <div className="mnp-backdrop" />

      <IconLogo className="mnp-watermark" style={{ color: 'var(--petrol-700)' }} />

      <button type="button" onClick={onClose} aria-label="Close menu" className="mnp-close">
        <X className="w-[clamp(1.5rem,4vw,2rem)] h-[clamp(1.5rem,4vw,2rem)]" />
      </button>

      <div className="mnp-content">
        <div ref={logoStageRef} className="mnp-logo-stage">
          <div ref={logoFlipRef} className="mnp-logo-flip">
            <svg viewBox={LOGO_VIEWBOX} className="mnp-logo-svg" style={{ color: 'var(--contigo-primary)' }}>
              <g fill="currentColor">{logoPaths}</g>
            </svg>
          </div>
        </div>

        <div className="mnp-rule" aria-hidden="true" />

        <nav aria-label="Mobile">
          <ul ref={navListRef} className="mnp-nav-list">
            {NAV_LINKS.map((item) => (
              <li key={item.href} className="mnp-nav-item">
                <Link href={item.href} onClick={onClose} className="mnp-nav-link">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mnp-nav-item">
              <button type="button" onClick={onContactClick} className="mnp-nav-link">
                Contact
              </button>
            </li>
            <li className="mnp-nav-item mnp-nav-item--cta">
              <Button
                onClick={onQuoteClick}
                variant="primary"
                size="md"
                className="mnp-cta-btn"
                style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
              >
                Request a Quote
              </Button>
            </li>
          </ul>
        </nav>

        <div ref={socialsRef} className="mnp-socials">
          {SOCIAL_LINKS.map(({ Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mnp-social-link"
              style={{ color: 'var(--neutral-50)', borderColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--contigo-primary)'
                e.currentTarget.style.borderColor = 'var(--contigo-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--neutral-50)'
                e.currentTarget.style.borderColor = 'transparent'
              }}
              aria-label={label}
            >
              <Icon className="w-[clamp(1.125rem,3.5vw,1.375rem)] h-[clamp(1.125rem,3.5vw,1.375rem)]" strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
