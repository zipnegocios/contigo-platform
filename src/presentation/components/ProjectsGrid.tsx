'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ProjectItem {
  id: string
  slug: string
  title: string
  category: string
  location: string
  coverImageUrl: string
  featured: boolean
  completedDate: Date
}

interface ProjectsGridProps {
  projects: ProjectItem[]
  categories: string[]
}

export function ProjectsGrid({ projects, categories }: ProjectsGridProps) {
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? projects : projects.filter((p) => p.category === active)

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={
              active === cat
                ? { backgroundColor: '#E2C063', color: '#1E1A16' }
                : {
                    backgroundColor: 'transparent',
                    color: '#6B6560',
                    border: '1px solid #E5DDD0',
                  }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: '#A89E8C' }}>
          No projects in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => {
            const year = new Date(project.completedDate).getFullYear()
            return (
              <Link key={project.id} href={`/projects/${project.slug}`} className="group block">
                <div
                  className="relative overflow-hidden rounded-2xl"
                  style={{ aspectRatio: '4/3', backgroundColor: '#1E1A16' }}
                >
                  <img
                    src={project.coverImageUrl}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Gradient overlay — always visible at bottom */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(30,26,22,0.85) 0%, rgba(30,26,22,0.1) 55%, transparent 100%)',
                    }}
                  />

                  {/* Featured badge */}
                  {project.featured && (
                    <div className="absolute top-4 left-4">
                      <span
                        className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-semibold"
                        style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
                      >
                        Featured
                      </span>
                    </div>
                  )}

                  {/* Text block */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p
                      className="text-[10px] uppercase tracking-widest mb-1.5"
                      style={{ color: '#E2C063' }}
                    >
                      {project.category} · {year}
                    </p>
                    <h3
                      className="text-xl font-semibold leading-tight transition-colors duration-200"
                      style={{
                        fontFamily: 'var(--font-cormorant)',
                        color: '#FAF6F0',
                      }}
                    >
                      {project.title}
                    </h3>
                    <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: 'rgba(250,246,240,0.65)' }}>
                      {project.location}
                    </p>
                  </div>

                  {/* Arrow on hover */}
                  <div
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                    style={{ backgroundColor: 'rgba(226,192,99,0.25)', color: '#E2C063', border: '1px solid rgba(226,192,99,0.4)' }}
                  >
                    <span className="text-sm">→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
