import Link from 'next/link'
import { Metadata } from 'next'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export const metadata: Metadata = {
  title: 'Projects | Contigo Constructions',
  description: 'View our completed construction projects across residential, commercial, and industrial sectors.',
  openGraph: {
    title: 'Our Projects | Contigo Constructions',
    description: 'View our completed construction projects',
    type: 'website',
  },
}

export default async function ProjectsPage() {
  let projects = []

  try {
    if (process.env.DATABASE_URL) {
      const projectRepo = new DrizzleProjectRepository()
      projects = await projectRepo.findPublished(100)
    }
  } catch (error) {
    console.warn('ProjectsPage: Could not fetch projects:', error)
  }

  const featuredProjects = projects.filter((p) => p.featured)
  const allProjects = projects

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Our Projects
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
            Explore our collection of completed construction projects across residential, commercial, and industrial sectors.
          </p>
        </div>

        {/* Featured Projects Section */}
        {featuredProjects.length > 0 && (
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10">
              Featured Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
                    {/* Image Container */}
                    <div className="relative h-64 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={project.coverImageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-full">
                          Featured
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {project.category}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {project.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Projects Section */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10">
            All Projects
          </h2>
          {allProjects.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No projects published yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
                    {/* Image Container */}
                    <div className="relative h-64 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={project.coverImageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {project.category}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {project.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
