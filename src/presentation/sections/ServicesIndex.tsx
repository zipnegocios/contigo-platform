'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ServiceIcon } from '@/presentation/components/ServiceIcons'
import type { ServiceView } from '@/presentation/data/serviceMeta'

interface Props {
  services: ServiceView[]
}

/** Reactive `(hover: none)` check — SSR-safe, no setState-in-effect. */
function useHasNoHover(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia('(hover: none)')
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia('(hover: none)').matches,
    () => false, // server: assume hover-capable (desktop) to avoid hydration flash
  )
}

export default function ServicesIndex({ services }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [active, setActive] = useState<number | null>(null)
  const isTouch = useHasNoHover()

  /* ── Load choreography (one orchestrated reveal) ─────────────────────────
     fromTo + clearProps (not `from`): explicit endpoints survive React 19
     StrictMode's double-mount, and clearing inline styles on complete hands
     control back to CSS so the hover dim/active opacity states work. The CSS
     default is already visible, so reduced-motion / no-JS ship fully legible. */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const ctx = gsap.context(() => {
      if (introRef.current) {
        gsap.fromTo(
          introRef.current.children,
          { opacity: 0, y: 18, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            clearProps: 'opacity,transform,filter',
          },
        )
      }
      const rows = listRef.current?.querySelectorAll('.atelier-row')
      if (rows && rows.length) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.055,
            delay: 0.15,
            clearProps: 'opacity,transform',
          },
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  /* ── Touch: activate the row nearest the viewport centre on scroll ───── */
  useEffect(() => {
    if (!isTouch || !listRef.current) return

    const rows = Array.from(
      listRef.current.querySelectorAll<HTMLElement>('.atelier-row'),
    )
    if (!rows.length) return

    setActive(0)

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible intersecting row.
        let best: { idx: number; ratio: number } | null = null
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const idx = rows.indexOf(e.target as HTMLElement)
          if (idx === -1) continue
          if (!best || e.intersectionRatio > best.ratio) {
            best = { idx, ratio: e.intersectionRatio }
          }
        }
        if (best) setActive(best.idx)
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.5, 1] },
    )

    rows.forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [isTouch])

  /* ── Desktop hover / focus handlers ──────────────────────────────────── */
  const onEnter = (i: number) => {
    if (!isTouch) setActive(i)
  }
  const onListLeave = () => {
    if (!isTouch) setActive(null)
  }
  const onListBlur = (e: React.FocusEvent<HTMLUListElement>) => {
    if (isTouch) return
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setActive(null)
    }
  }

  const activeMode = isTouch || active !== null

  return (
    <section
      id="services-index"
      ref={sectionRef}
      className="atelier"
      data-active={activeMode || undefined}
    >
      {/* ── Sticky stage: full-bleed image takeover (desktop) ── */}
      <div className="atelier-stage" aria-hidden="true" data-visible={active !== null || undefined}>
        {services.map((s, i) => (
          <div key={s.slug} className="atelier-scene" data-active={i === active || undefined}>
            <div className="atelier-scene-img" style={{ backgroundImage: `url(${s.image})` }} />
          </div>
        ))}
        <div className="atelier-veil" />
      </div>

      {/* ── Intro ── */}
      <header ref={introRef} className="atelier-intro">
        <span className="atelier-eyebrow">Our Craft</span>
        <h1 className="atelier-title">
          Ten disciplines.
          <br />
          One standard.
        </h1>
        <p className="atelier-lede">
          From the first footing to the final coat of Venetian plaster, every
          stage of your home is in one set of hands. Run the list.
        </p>
      </header>

      {/* ── Index + reveal copy ── */}
      <div className="atelier-body">
        <ul
          ref={listRef}
          className="atelier-index"
          onMouseLeave={onListLeave}
          onBlur={onListBlur}
        >
          {services.map((s, i) => {
            const state =
              active === null ? 'rest' : i === active ? 'active' : 'dim'
            return (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="atelier-row"
                  data-state={state}
                  onMouseEnter={() => onEnter(i)}
                  onFocus={() => onEnter(i)}
                >
                  {/* mobile-only tile media */}
                  <span
                    className="atelier-row-media"
                    style={{ backgroundImage: `url(${s.image})` }}
                    aria-hidden="true"
                  />
                  <span className="atelier-row-inner">
                    <span className="atelier-num">{s.number}</span>
                    <span className="atelier-name">{s.name}</span>
                    <span className="atelier-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                  {/* mobile-only copy */}
                  {s.tagline && <span className="atelier-row-tagline">{s.tagline}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* desktop reveal copy (right column, over the image) */}
        <div className="atelier-copy-stage" aria-hidden="true">
          {services.map((s, i) => (
            <div key={s.slug} className="atelier-copy" data-active={i === active || undefined}>
              <ServiceIcon name={s.iconKey} className="atelier-copy-icon" />
              {s.tagline && <p className="atelier-copy-tagline">{s.tagline}</p>}
              {s.support && <p className="atelier-copy-support">{s.support}</p>}
              <span className="atelier-copy-cta">Explore this service →</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Closing ── */}
      <footer className="atelier-closing">
        <p className="atelier-closing-kicker">Building dreams together</p>
        <h2 className="atelier-closing-title">Let&apos;s build yours.</h2>
        <Link href="/#contact" className="atelier-closing-cta">
          Start your project
          <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </section>
  )
}
