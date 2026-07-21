'use client'

import Link from 'next/link'
import { CategoryFilterPills } from './CategoryFilterPills'
import { isVideoUrl } from '@/presentation/lib/media-type'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import { cfImage } from '@/presentation/lib/cloudflareImage'

interface ProjectItem {
  id: string
  slug: string
  title: string
  category: string
  categoryId: string | null
  location: string
  coverImageUrl: string
  coverPosterUrl?: string | null
  featured: boolean
  completedDate: Date
}

interface FilterCategory {
  id: string
  name: string
  slug: string
}

interface ProjectsGridProps {
  projects: ProjectItem[]
  allCategories: FilterCategory[]
  activeSlug: string | null
}

export function ProjectsGrid({ projects, allCategories, activeSlug }: ProjectsGridProps) {
  return (
    <div>
      {/* Category filter pills */}
      {allCategories.length > 0 && (
        <div className="mb-10">
          <CategoryFilterPills
            categories={allCategories}
            activeSlug={activeSlug}
            basePath="/projects"
          />
        </div>
      )}

      {/* Grid */}
      {projects.length === 0 ? (
        <p className="py-16 text-center text-fluid-sm" style={{ color: '#A89E8C' }}>
          No projects in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const year = new Date(project.completedDate).getFullYear()
            const video = isVideoUrl(project.coverImageUrl)
            const categorySlug =
              allCategories.find((c) => c.id === project.categoryId)?.slug ?? generateSlug(project.category)
            return (
              <Link key={project.id} href={`/projects/${categorySlug}/${project.slug}`} className="group block">
                <div
                  className="relative overflow-hidden rounded-2xl"
                  style={{ aspectRatio: '4/3', backgroundColor: '#1E1A16' }}
                >
                  {video ? (
                    <video
                      src={project.coverImageUrl}
                      poster={project.coverPosterUrl ? cfImage(project.coverPosterUrl, { width: 900 }) : undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={cfImage(project.coverImageUrl, { width: 900 })}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(30,26,22,0.85) 0%, rgba(30,26,22,0.1) 55%, transparent 100%)',
                    }}
                  />

                  {project.featured && (
                    <div className="absolute top-4 left-4">
                      <span
                        className="text-[clamp(0.5625rem,1vw,0.6875rem)] uppercase tracking-widest px-2.5 py-1 rounded-full font-semibold"
                        style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
                      >
                        Featured
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p
                      className="text-[clamp(0.5625rem,1vw,0.6875rem)] uppercase tracking-widest mb-1.5"
                      style={{ color: '#E2C063' }}
                    >
                      {project.category} · {year}
                    </p>
                    <h3
                      className="text-fluid-xl font-semibold leading-tight transition-colors duration-200"
                      style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
                    >
                      {project.title}
                    </h3>
                    <p className="text-fluid-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: 'rgba(250,246,240,0.65)' }}>
                      {project.location}
                    </p>
                  </div>

                  <div
                    className="absolute top-4 right-4 w-[clamp(1.75rem,3vw,2rem)] h-[clamp(1.75rem,3vw,2rem)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                    style={{ backgroundColor: 'rgba(226,192,99,0.25)', color: '#E2C063', border: '1px solid rgba(226,192,99,0.4)' }}
                  >
                    <span className="text-fluid-sm">→</span>
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
