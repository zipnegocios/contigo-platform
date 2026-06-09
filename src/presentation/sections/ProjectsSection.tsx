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
  coverImageUrl: string
  coverPosterUrl: string | null
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
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  const [cardsPerPage, setCardsPerPage] = useState<number>(5)
  const [startIndex, setStartIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const animatingRef = useRef(false)

  /* ── responsive cardsPerPage + resize handler ─────────────────────────── */
  useEffect(() => {
    setCardsPerPage(getCardsPerPage())
    const handler = () => {
      // Kill any animation in progress
      if (timelineRef.current) {
        timelineRef.current.kill()
        animatingRef.current = false
      }
      setCardsPerPage(getCardsPerPage())
      setStartIndex(0)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const totalPositions = Math.max(1, projects.length - cardsPerPage + 1)
  const visibleProjects = projects.slice(startIndex, startIndex + cardsPerPage)
  const hasNav = totalPositions > 1

  /* ── staggered navigation with GSAP timeline ──────────────────────────── */
  const navigate = useCallback(
    (newIndex: number, dir: 'next' | 'prev') => {
      if (animatingRef.current || !listRef.current) return
      animatingRef.current = true
      setIsPaused(true)

      const outX = dir === 'next' ? -100 : 100  // pixels
      const inX = dir === 'next' ? 100 : -100

      // Snapshot current <li> elements BEFORE state update
      const currentLis = Array.from(
        listRef.current.querySelectorAll('.accordion-item'),
      ) as HTMLLIElement[]

      let newLis: HTMLLIElement[] = []

      // Create main timeline
      const tl = gsap.timeline()

      // PHASE 1: animate current cards OUT with stagger
      tl.to(
        currentLis,
        {
          x: outX,
          opacity: 0,
          duration: 0.35,
          stagger: 0.06,
          ease: 'power2.in',
        },
        0,
      )

      // PHASE 1.5: update DOM (new cards render)
      tl.call(() => {
        flushSync(() => setStartIndex(newIndex))
      })

      // PHASE 1.75: prepare new cards (off-screen)
      tl.call(() => {
        newLis = Array.from(
          listRef.current!.querySelectorAll('.accordion-item'),
        ) as HTMLLIElement[]
        gsap.set(newLis, { x: inX, opacity: 0 })
      })

      // PHASE 2: animate new cards IN with stagger
      tl.to(
        newLis,
        {
          x: 0,
          opacity: 1,
          duration: 0.35,
          stagger: 0.06,
          ease: 'power2.out',
          onComplete() {
            animatingRef.current = false
            setIsPaused(false)
          },
        },
      )

      timelineRef.current = tl
    },
    [],
  )

  const prev = () => navigate((startIndex - 1 + totalPositions) % totalPositions, 'prev')
  const next = () => navigate((startIndex + 1) % totalPositions, 'next')
  const goTo = (i: number) => navigate(i, i > startIndex ? 'next' : 'prev')

  /* ── autoplay: 4s interval, paused when isPaused ───────────────────────── */
  useEffect(() => {
    if (!hasNav || isPaused) return
    const timer = setInterval(
      () => navigate((startIndex + 1) % totalPositions, 'next'),
      4000,
    )
    return () => clearInterval(timer)
  }, [hasNav, isPaused, startIndex, totalPositions, navigate])

  /* ── GSAP scroll reveals ──────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
      gsap.from(metaRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: metaRef.current, start: 'top 90%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const arrowBtn: React.CSSProperties = {
    backgroundColor: 'rgba(30,26,22,0.60)',
    color: '#E2C063',
    border: '1px solid rgba(226,192,99,0.45)',
  }

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--monolith-concrete)' }}
    >
      {/* Header */}
      <div ref={headerRef}>
        <span className="label block mb-4" style={{ color: 'var(--monolith-slate)' }}>
          PORTFOLIO
        </span>
        <h2 style={{ color: 'var(--monolith-ink)' }}>Featured Projects</h2>
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 text-sm" style={{ color: 'var(--monolith-slate)' }}>
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
            >
              ‹
            </button>
          )}

          {/* Track — clips the sliding cards */}
          <div className="flex-1 overflow-hidden">
            <ul
              ref={listRef}
              className="accordion-list"
              onMouseEnter={() => {
                if (timelineRef.current) timelineRef.current.pause()
                setIsPaused(true)
              }}
              onMouseLeave={() => {
                if (timelineRef.current) timelineRef.current.resume()
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
                      autoPlay
                      muted
                      loop
                      playsInline
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
            >
              ›
            </button>
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
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: i === startIndex ? '#2D2924' : 'rgba(30,26,22,0.28)',
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
        style={{ color: 'var(--monolith-slate)' }}
      >
        <span className="data-text">
          Project count: {projects.length} | Locations: Adelaide Metro | Est. 2015
        </span>
        <a
          href="/projects"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--monolith-ink)' }}
        >
          View all →
        </a>
      </div>
    </section>
  )
}
