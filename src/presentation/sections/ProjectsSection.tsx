'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
  const trackRef    = useRef<HTMLDivElement>(null)       // overflow-hidden wrapper
  const metaRef     = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const cloneRef    = useRef<HTMLUListElement | null>(null) // active DOM clone

  const [cardsPerPage, setCardsPerPage] = useState<number>(() => getCardsPerPage())
  const [startIndex,   setStartIndex]   = useState(0)
  const [isPaused,     setIsPaused]     = useState(false)
  const animatingRef = useRef(false)

  /* ── responsive cardsPerPage ─────────────────────────────────────────── */
  useEffect(() => {
    const handler = () => {
      // Kill animation and clean up any orphaned clone
      if (timelineRef.current) timelineRef.current.kill()
      if (cloneRef.current) {
        cloneRef.current.remove()
        cloneRef.current = null
      }
      if (trackRef.current) trackRef.current.style.position = ''
      if (listRef.current) {
        const lis = listRef.current.querySelectorAll<HTMLLIElement>('.accordion-item')
        gsap.set(Array.from(lis), { clearProps: 'all' })
      }
      animatingRef.current = false
      setCardsPerPage(getCardsPerPage())
      setStartIndex(0)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const totalPositions = Math.max(1, projects.length - cardsPerPage + 1)
  const visibleProjects = projects.slice(startIndex, startIndex + cardsPerPage)
  const hasNav = totalPositions > 1

  /* ── clone-based crossfade navigation ───────────────────────────────── */
  const navigate = useCallback(
    (newIndex: number, dir: 'next' | 'prev') => {
      if (animatingRef.current || !listRef.current || !trackRef.current) return
      animatingRef.current = true
      setIsPaused(true)

      const trackWidth = trackRef.current.offsetWidth
      const outX = dir === 'next' ? -trackWidth :  trackWidth
      const inX  = dir === 'next' ?  trackWidth : -trackWidth

      // ── A: Clone current <ul> absolutely over the track ──────────────
      const clone = listRef.current.cloneNode(true) as HTMLUListElement
      Object.assign(clone.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        margin: '0',
        pointerEvents: 'none',
        zIndex: '1',
      })
      trackRef.current.style.position = 'relative'
      trackRef.current.appendChild(clone)
      cloneRef.current = clone

      // ── B: Swap DOM content synchronously (new cards behind clone) ───
      flushSync(() => setStartIndex(newIndex))

      // ── C: Immediately hide new cards before any browser paint ───────
      const newLis = Array.from(
        listRef.current.querySelectorAll<HTMLLIElement>('.accordion-item'),
      )
      gsap.set(newLis, { x: inX, opacity: 0 })

      // ── D: Simultaneous exit (clones) + entrance (new cards) ─────────
      const cloneLis = Array.from(
        clone.querySelectorAll<HTMLLIElement>('.accordion-item'),
      )

      const tl = gsap.timeline({
        onComplete() {
          clone.remove()
          cloneRef.current = null
          if (trackRef.current) trackRef.current.style.position = ''
          // clearProps restores natural CSS so accordion flex works again
          gsap.set(newLis, { clearProps: 'all' })
          animatingRef.current = false
          setIsPaused(false)
        },
      })

      // Clones exit with stagger
      tl.to(
        cloneLis,
        { x: outX, opacity: 0, duration: 0.4, stagger: 0.07, ease: 'power2.in' },
        0,
      )
      // New cards enter with stagger, 100ms after exit starts (push feel)
      tl.to(
        newLis,
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' },
        0.1,
      )

      timelineRef.current = tl
    },
    [],
  )

  const prev = () => navigate((startIndex - 1 + totalPositions) % totalPositions, 'prev')
  const next = () => navigate((startIndex + 1) % totalPositions, 'next')
  const goTo = (i: number) => navigate(i, i > startIndex ? 'next' : 'prev')

  /* ── autoplay: 4 s, pauses while isPaused ───────────────────────────── */
  useEffect(() => {
    if (!hasNav || isPaused) return
    const timer = setInterval(
      () => navigate((startIndex + 1) % totalPositions, 'next'),
      4000,
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

          {/* Track — clips sliding cards; ref needed for offsetWidth */}
          <div ref={trackRef} className="flex-1 overflow-hidden">
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
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: i === startIndex ? 'var(--neutral-900)' : 'var(--neutral-800-28)',
                transition: 'background-color 0.2s ease',
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
