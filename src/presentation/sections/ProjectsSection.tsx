'use client'

import { useEffect, useRef, useState } from 'react'
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

  const [cardsPerPage, setCardsPerPage] = useState<number>(5)
  const [currentPage, setCurrentPage] = useState(0)

  // Responsive cardsPerPage
  useEffect(() => {
    setCardsPerPage(getCardsPerPage())
    const handler = () => {
      setCardsPerPage(getCardsPerPage())
      setCurrentPage(0)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const totalPages = Math.ceil(projects.length / cardsPerPage)
  const visibleProjects = projects.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage)

  const navigate = (newPage: number) => {
    if (listRef.current) {
      listRef.current.style.opacity = '0'
      listRef.current.style.transform = 'translateX(8px)'
    }
    setTimeout(() => {
      setCurrentPage(newPage)
      if (listRef.current) {
        listRef.current.style.opacity = '1'
        listRef.current.style.transform = 'translateX(0)'
      }
    }, 180)
  }

  const prev = () => navigate((currentPage - 1 + totalPages) % totalPages)
  const next = () => navigate((currentPage + 1) % totalPages)

  // GSAP scroll animations
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

  const goldBtn: React.CSSProperties = {
    backgroundColor: 'rgba(226,192,99,0.18)',
    color: '#E2C063',
    border: '1px solid rgba(226,192,99,0.4)',
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
          {totalPages > 1 && (
            <button
              onClick={prev}
              aria-label="Previous"
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl"
              style={goldBtn}
            >
              ‹
            </button>
          )}

          {/* Accordion list */}
          <ul
            ref={listRef}
            className="accordion-list flex-1"
            style={{ transition: 'opacity 0.35s ease, transform 0.35s ease' }}
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

          {/* Next arrow */}
          {totalPages > 1 && (
            <button
              onClick={next}
              aria-label="Next"
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl"
              style={goldBtn}
            >
              ›
            </button>
          )}
        </div>
      )}

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              aria-label={`Page ${i + 1}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: i === currentPage ? '#E2C063' : 'rgba(226,192,99,0.25)',
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
