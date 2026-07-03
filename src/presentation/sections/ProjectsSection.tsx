'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

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
        <p className="mt-8 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
          No featured projects yet.
        </p>
      ) : (
        <div className="relative mt-8 flex items-center gap-3">
          {/* Prev arrow */}
          {hasNav && (
            <button
              onClick={prev}
              aria-label="Previous"
              className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex-shrink-0 flex items-center justify-center text-fluid-xl"
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
              className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex-shrink-0 flex items-center justify-center text-fluid-xl"
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

      {/* Footer CTA — brand-gold button with a light sweep + lift on hover,
          matching the "View All Services" CTA for a consistent look and feel */}
      <div ref={metaRef} className="text-center mt-14">
        <a
          href="/projects"
          className="service-cta-gold group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-9 py-4 text-fluid-sm font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: 'linear-gradient(135deg, var(--gold-400, #E2C063) 0%, var(--gold-600, #C9A04E) 100%)',
            color: 'var(--petrol-950, #051E27)',
            fontFamily: 'var(--font-alegreya-sans)',
          }}
        >
          {/* Light sweep */}
          <span
            aria-hidden
            className="service-cta-sweep pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/35 blur-md transition-[left] duration-700 ease-out group-hover:left-[140%]"
          />
          <span className="relative z-10">View All Projects</span>
          <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  )
}
