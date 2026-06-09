'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { VideoWithFallback } from '@/presentation/components/VideoWithFallback'

gsap.registerPlugin(ScrollTrigger)

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

/**
 * Returns the number of cards visible at the current viewport width.
 * Starts at 0 (sentinel) to avoid SSR/client hydration mismatch.
 * The carousel defers rendering until after the first client effect.
 */
function useCardsPerView() {
  const [count, setCount] = useState(0) // 0 = not yet measured client-side
  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w >= 1280)      setCount(5)
      else if (w >= 1024) setCount(4)
      else if (w >= 768)  setCount(3)
      else if (w >= 560)  setCount(2)
      else                setCount(1)
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])
  return count
}

interface ProjectItem {
  id: string
  slug: string
  title: string
  category: string
  location?: string
  coverImageUrl: string
  coverPosterUrl?: string | null
}

export default function ProjectsSection() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const headerRef   = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const metaRef     = useRef<HTMLDivElement>(null)

  const [projects, setProjects] = useState<ProjectItem[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const cardsPerView = useCardsPerView()
  const total        = projects?.length ?? 0
  const maxIndex     = cardsPerView > 0 ? Math.max(0, total - cardsPerView) : 0
  const showNav      = cardsPerView > 0 && total > cardsPerView
  const dotCount     = maxIndex + 1
  const useDots      = dotCount <= 10

  // Clamp index when breakpoint or project count changes
  useEffect(() => {
    setCurrentIndex(i => Math.min(i, maxIndex))
  }, [maxIndex])

  // Fetch all featured projects
  useEffect(() => {
    fetch('/api/projects/featured')
      .then(r => (r.ok ? r.json() : []))
      .then((data: ProjectItem[]) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
  }, [])

  // GSAP scroll entrance — runs after data arrives
  useEffect(() => {
    if (projects === null) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
      gsap.from(carouselRef.current, {
        opacity: 0, y: 40, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
      gsap.from(metaRef.current, {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: metaRef.current, start: 'top 90%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [projects])

  const prev = () => setCurrentIndex(i => Math.max(0, i - 1))
  const next = () => setCurrentIndex(i => Math.min(maxIndex, i + 1))

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--monolith-concrete)' }}
    >
      {/* ── Header ── */}
      <div ref={headerRef} className="flex items-end justify-between mb-8">
        <div>
          <span className="label block mb-4" style={{ color: 'var(--monolith-slate)' }}>
            PORTFOLIO
          </span>
          <h2 style={{ color: 'var(--monolith-ink)' }}>Featured Projects</h2>
        </div>
        <a
          href="/projects"
          className="text-sm font-medium transition-opacity hover:opacity-70 hidden sm:block"
          style={{ color: 'var(--monolith-ink)', paddingBottom: '0.25rem' }}
        >
          View all →
        </a>
      </div>

      {/* ── Loading skeleton ── */}
      {projects === null && (
        <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label="Loading projects">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-2xl"
              style={{
                width: '33.333%',
                aspectRatio: '4/3',
                backgroundColor: 'rgba(45,41,36,0.08)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {projects !== null && projects.length === 0 && (
        <p className="mt-8 text-sm" style={{ color: 'var(--monolith-slate)' }}>
          No featured projects yet.
        </p>
      )}

      {/* ── Multi-card carousel (deferred until cardsPerView is measured) ── */}
      {projects !== null && projects.length > 0 && cardsPerView > 0 && (
        <>
          {/* Carousel track */}
          <div ref={carouselRef} className="overflow-hidden">
            <div
              className="flex"
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
                transition: 'transform 480ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {projects.map((project) => {
                const hasVideo = isVideo(project.coverImageUrl)
                const poster   = project.coverPosterUrl ?? project.coverImageUrl

                return (
                  <div
                    key={project.id}
                    style={{ width: `${100 / cardsPerView}%`, flexShrink: 0, padding: '0 6px' }}
                  >
                    <a
                      href={`/projects/${project.slug}`}
                      className="block relative overflow-hidden rounded-2xl group"
                      style={{ aspectRatio: '4/3', display: 'block' }}
                      aria-label={project.title}
                    >
                      {/* Cover: VideoWithFallback or plain image */}
                      {hasVideo ? (
                        <VideoWithFallback
                          videoSrc={project.coverImageUrl}
                          posterSrc={poster}
                          className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={project.coverImageUrl}
                          alt={project.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}

                      {/* Dark gradient overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(30,26,22,0.90) 0%, rgba(30,26,22,0.15) 55%, transparent 100%)',
                          zIndex: 3,
                        }}
                      />

                      {/* Caption */}
                      <div
                        className="absolute bottom-0 left-0 right-0 p-4 md:p-5"
                        style={{ zIndex: 4 }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-widest mb-1 truncate"
                          style={{ color: '#E2C063' }}
                        >
                          {project.category}
                        </p>
                        <p
                          className="font-semibold leading-tight line-clamp-2"
                          style={{
                            fontFamily: 'var(--font-cormorant)',
                            color: '#FAF6F0',
                            fontSize: cardsPerView >= 4 ? '1rem' : '1.2rem',
                          }}
                        >
                          {project.title}
                        </p>
                      </div>

                      {/* Arrow hover badge */}
                      <div
                        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0"
                        style={{
                          backgroundColor: 'rgba(226,192,99,0.18)',
                          color: '#E2C063',
                          border: '1px solid rgba(226,192,99,0.35)',
                          zIndex: 4,
                        }}
                      >
                        <span className="text-xs" aria-hidden="true">→</span>
                      </div>
                    </a>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Navigation ── */}
          {showNav && (
            <div className="flex items-center justify-between mt-5">
              {/* Dots / counter */}
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Carousel position">
                {useDots
                  ? Array.from({ length: dotCount }).map((_, i) => (
                      <button
                        key={i}
                        role="tab"
                        aria-selected={i === currentIndex}
                        aria-label={`Go to position ${i + 1}`}
                        onClick={() => setCurrentIndex(i)}
                        className="rounded-full transition-all duration-250"
                        style={{
                          height: 8,
                          width: i === currentIndex ? 22 : 8,
                          backgroundColor:
                            i === currentIndex
                              ? '#E2C063'
                              : 'rgba(226,192,99,0.22)',
                        }}
                      />
                    ))
                  : (
                    <span
                      className="text-xs tabular-nums"
                      aria-live="polite"
                      style={{ color: 'var(--monolith-slate)' }}
                    >
                      {currentIndex + 1} — {dotCount}
                    </span>
                  )}
              </div>

              {/* Prev / Next arrows */}
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  disabled={currentIndex === 0}
                  aria-label="Previous projects"
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-25"
                  style={{
                    backgroundColor: 'rgba(226,192,99,0.10)',
                    color: '#E2C063',
                    border: '1px solid rgba(226,192,99,0.28)',
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  disabled={currentIndex >= maxIndex}
                  aria-label="Next projects"
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-25"
                  style={{
                    backgroundColor: 'rgba(226,192,99,0.10)',
                    color: '#E2C063',
                    border: '1px solid rgba(226,192,99,0.28)',
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Footer meta ── */}
      <div
        ref={metaRef}
        className="flex items-center justify-between mt-8 text-sm"
        style={{ color: 'var(--monolith-slate)' }}
      >
        <span className="data-text">
          Project count: 47 | Locations: Adelaide Metro | Est. 2015
        </span>
        <a
          href="/projects"
          className="text-sm font-medium transition-opacity hover:opacity-70 sm:hidden"
          style={{ color: 'var(--monolith-ink)' }}
        >
          View all →
        </a>
      </div>
    </section>
  )
}
