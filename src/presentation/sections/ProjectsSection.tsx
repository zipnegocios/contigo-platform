'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface ProjectItem {
  id: string
  slug: string
  title: string
  category: string
  location: string
  completedDate?: string | null
  coverImageUrl: string
  coverPosterUrl: string | null
}

// ── Rotating location labels ──────────────────────────────────────────────────

function formatLocationLabel(location: string, date?: string | null): string {
  if (!date) return location
  try {
    const d = new Date(date)
    const month = d.toLocaleDateString('en-AU', { month: 'long' })
    return `${location} — ${month} ${d.getFullYear()}`
  } catch {
    return location
  }
}

function RotatingText({ items, externalPaused }: { items: string[]; externalPaused: boolean }) {
  const outerRef   = useRef<HTMLSpanElement>(null)
  const innerRef   = useRef<HTMLSpanElement>(null)
  const idxRef     = useRef(0)
  const hoverRef   = useRef(false)

  useEffect(() => {
    if (items.length === 0) return
    // seed initial text
    if (innerRef.current) innerRef.current.textContent = items[0]
  }, [items])

  useEffect(() => {
    if (items.length <= 1) return

    // Visible hold: 1500 ms fixed + 0–1000 ms random jitter, then 0.7 s of animation
    const holdDelay = () => 1500 + Math.random() * 1000

    let timer: ReturnType<typeof setTimeout>

    const schedule = () => {
      timer = setTimeout(tick, holdDelay())
    }

    const tick = () => {
      if (externalPaused || hoverRef.current || !innerRef.current) {
        // paused — check again after a short poll so we don't lose the beat
        timer = setTimeout(tick, 300)
        return
      }
      // pick random index ≠ current
      let next = idxRef.current
      while (next === idxRef.current) next = Math.floor(Math.random() * items.length)

      const el = innerRef.current
      // onComplete schedules the next hold immediately after entrance finishes
      const tl = gsap.timeline({ onComplete: schedule })
      tl.to(el, { y: -22, opacity: 0, duration: 0.35, ease: 'power2.in' })
      tl.call(() => {
        el.textContent = items[next]
        idxRef.current = next
        gsap.set(el, { y: 22, opacity: 0 })
      })
      tl.to(el, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' })
    }

    schedule()
    return () => clearTimeout(timer)
  }, [items, externalPaused])

  if (items.length === 0) return <span>—</span>

  return (
    <span
      ref={outerRef}
      style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', height: '1.35em' }}
      onMouseEnter={() => { hoverRef.current = true }}
      onMouseLeave={() => { hoverRef.current = false }}
    >
      <span ref={innerRef} style={{ display: 'inline-block' }} />
    </span>
  )
}

interface Props {
  projects: ProjectItem[]
}

const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)/i.test(url)

function getCardsPerPage(): number {
  if (typeof window === 'undefined') return 5
  const w = window.innerWidth
  if (w >= 1024) return 5
  if (w >= 768) return 3
  if (w >= 480) return 2
  return 1
}

export default function ProjectsSection({ projects }: Props) {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const headerRef   = useRef<HTMLDivElement>(null)
  const listRef     = useRef<HTMLUListElement>(null)
  const metaRef     = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Animation | null>(null)
  const didMountRef = useRef(false)

  const [cardsPerPage, setCardsPerPage] = useState<number>(() => getCardsPerPage())
  const [startIndex,   setStartIndex]   = useState(0)
  const [isPaused,     setIsPaused]     = useState(false)
  const animatingRef = useRef(false)

  /* ── responsive cardsPerPage (debounced) ────────────────────────────── */
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>
    const handler = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (timelineRef.current) timelineRef.current.kill()
        if (listRef.current) {
          const lis = listRef.current.querySelectorAll<HTMLLIElement>('.accordion-item')
          gsap.set(Array.from(lis), { clearProps: 'all' })
        }
        animatingRef.current = false
        setCardsPerPage(getCardsPerPage())
        setStartIndex(0)
      }, 150)
    }
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('resize', handler)
      clearTimeout(resizeTimer)
    }
  }, [])

  const totalPositions = Math.max(1, projects.length - cardsPerPage + 1)
  const visibleProjects = projects.slice(startIndex, startIndex + cardsPerPage)
  const hasNav = totalPositions > 1

  /* ── dissolve navigation: fade + scale, no clones / no flushSync ─────── */
  const navigate = useCallback((newIndex: number) => {
    if (animatingRef.current || !listRef.current) return
    animatingRef.current = true
    setIsPaused(true)

    // Reduced motion → instant swap
    if (prefersReducedMotion()) {
      setStartIndex(newIndex)
      return
    }

    const currentLis = Array.from(
      listRef.current.querySelectorAll<HTMLLIElement>('.accordion-item'),
    )

    // Phase 1: fade the current set OUT in place; on complete, swap React state.
    // Phase 2 (entrance) runs in the useLayoutEffect keyed on startIndex.
    timelineRef.current = gsap.to(currentLis, {
      opacity: 0,
      scale: 0.97,
      filter: 'blur(4px)',
      duration: 0.3,
      stagger: 0.04,
      ease: 'power2.in',
      onComplete: () => setStartIndex(newIndex),
    })
  }, [])

  /* ── entrance: fade the new set IN (runs after DOM commit, before paint) */
  useLayoutEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    if (!listRef.current) return

    const newLis = Array.from(
      listRef.current.querySelectorAll<HTMLLIElement>('.accordion-item'),
    )

    const finish = () => {
      // clearProps restores natural CSS so accordion hover-expand works again
      gsap.set(newLis, { clearProps: 'all' })
      animatingRef.current = false
      setIsPaused(false)
    }

    if (prefersReducedMotion() || newLis.length === 0) {
      finish()
      return
    }

    timelineRef.current = gsap.fromTo(
      newLis,
      { opacity: 0, scale: 1.03, filter: 'blur(4px)' },
      {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.45,
        stagger: 0.05,
        ease: 'power3.out',
        onComplete: finish,
      },
    )
  }, [startIndex])

  const prev = () => navigate((startIndex - 1 + totalPositions) % totalPositions)
  const next = () => navigate((startIndex + 1) % totalPositions)
  const goTo = (i: number) => { if (i !== startIndex) navigate(i) }

  /* ── autoplay: 5 s, pauses while isPaused ───────────────────────────── */
  useEffect(() => {
    if (!hasNav || isPaused) return
    const timer = setInterval(
      () => navigate((startIndex + 1) % totalPositions),
      5000,
    )
    return () => clearInterval(timer)
  }, [hasNav, isPaused, startIndex, totalPositions, navigate])

  /* ── GSAP scroll reveals ─────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
      gsap.from(metaRef.current, {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: metaRef.current, start: 'top 90%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const arrowBtn: React.CSSProperties = {
    backgroundColor: 'var(--neutral-800-60)',
    color: 'var(--contigo-primary)',
    border: '1px solid var(--gold-a30)',
  }

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--neutral-100)' }}
    >
      {/* Header */}
      <div ref={headerRef}>
        <span className="label block mb-4" style={{ color: 'var(--neutral-600)' }}>
          PORTFOLIO
        </span>
        <h2 style={{ color: 'var(--neutral-800)' }}>Featured Projects</h2>
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 text-sm" style={{ color: 'var(--neutral-600)' }}>
          No featured projects yet.
        </p>
      ) : (
        <div className="relative mt-8 flex items-center gap-3">
          {/* Prev arrow */}
          {hasNav && (
            <button
              onClick={prev}
              aria-label="Previous"
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl"
              style={arrowBtn}
            >‹</button>
          )}

          {/* Track — clips card transitions */}
          <div className="flex-1 overflow-hidden">
            <ul
              ref={listRef}
              className="accordion-list"
              onMouseEnter={() => {
                if (timelineRef.current) timelineRef.current.pause()
                setIsPaused(true)
              }}
              onMouseLeave={() => {
                if (timelineRef.current && animatingRef.current) {
                  timelineRef.current.resume()
                }
                setIsPaused(false)
              }}
            >
              {visibleProjects.map((project) => (
                <li key={project.id} className="accordion-item">
                  {/* Media layer */}
                  {isVideo(project.coverImageUrl) ? (
                    <video
                      src={project.coverImageUrl}
                      poster={project.coverPosterUrl ?? undefined}
                      autoPlay muted loop playsInline
                      className="accordion-video"
                    />
                  ) : (
                    <div
                      className="accordion-img"
                      style={{ backgroundImage: `url(${project.coverImageUrl})` }}
                    />
                  )}
                  {/* Link overlay */}
                  <a href={`/projects/${project.slug}`} className="accordion-link">
                    <p className="accordion-title">{project.title}</p>
                    <p className="accordion-desc">{project.category}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Next arrow */}
          {hasNav && (
            <button
              onClick={next}
              aria-label="Next"
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl"
              style={arrowBtn}
            >›</button>
          )}
        </div>
      )}

      {/* Dot indicators */}
      {hasNav && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPositions }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Position ${i + 1}`}
              style={{
                width: i === startIndex ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === startIndex ? 'var(--contigo-primary)' : 'var(--neutral-800-28)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Footer row */}
      <div
        ref={metaRef}
        className="flex items-center justify-between mt-8 text-sm"
        style={{ color: 'var(--neutral-600)' }}
      >
        <span className="data-text flex items-center gap-1 flex-wrap">
          <span>Project count: {projects.length}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>
            Project Location:{' '}
            <RotatingText
              items={projects.map((p) => formatLocationLabel(p.location, p.completedDate))}
              externalPaused={isPaused}
            />
          </span>
        </span>
        <a
          href="/projects"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--neutral-800)' }}
        >
          View all →
        </a>
      </div>
    </section>
  )
}
