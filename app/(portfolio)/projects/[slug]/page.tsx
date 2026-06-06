import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

interface ProjectDetailPageProps {
  params: {
    slug: string
  }
}

/**
 * Generate static params for all published projects
 * This enables static generation for better performance
 */
export async function generateStaticParams() {
  const projectRepo = new DrizzleProjectRepository()
  const projects = await projectRepo.findPublished(100)

  return projects.map((project) => ({
    slug: project.slug,
  }))
}

/**
 * Generate dynamic metadata for each project
 * This improves SEO with project-specific title and description
 */
export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const projectRepo = new DrizzleProjectRepository()
  const project = await projectRepo.findBySlug(params.slug)

  if (!project || !project.published) {
    return {
      title: 'Project not found',
    }
  }

  return {
    title: `${project.title} | Contigo Constructions`,
    description: project.description,
    openGraph: {
      title: `${project.title} | Contigo Constructions`,
      description: project.description,
      type: 'website',
      images: [
        {
          url: project.coverImageUrl,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
  }
}

/**
 * Enable dynamic parameters to handle new projects at runtime
 * Even though we generate static params, this allows for runtime generation
 */
export const dynamicParams = true

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const projectRepo = new DrizzleProjectRepository()
  const project = await projectRepo.findBySlug(params.slug)

  // Return 404 for unpublished or non-existent projects
  if (!project || !project.published) {
    notFound()
  }

  const formattedDate = new Date(project.completedDate).toLocaleDateString(
    'en-AU',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  )

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Back to Projects Link */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/projects"
            className="inline-flex items-center text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
          >
            <span className="mr-2">←</span>
            Back to Projects
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Cover Image */}
        <div className="mb-12 overflow-hidden rounded-lg">
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="w-full h-96 object-cover"
          />
        </div>

        {/* Project Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            {project.title}
          </h1>

          {/* Project Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-8 border-t border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Category
              </p>
              <p className="text-lg text-slate-900 dark:text-white font-medium">
                {project.category}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Location
              </p>
              <p className="text-lg text-slate-900 dark:text-white font-medium">
                {project.location}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Completed
              </p>
              <p className="text-lg text-slate-900 dark:text-white font-medium">
                {formattedDate}
              </p>
            </div>
            {project.featured && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </p>
                <div className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm font-semibold rounded-lg">
                  Featured
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Project Overview
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
        </div>

        {/* Gallery Section */}
        {project.galleryUrls && project.galleryUrls.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Project Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.galleryUrls.map((url, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <img
                    src={url}
                    alt={`${project.title} - Gallery ${index + 1}`}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Interested in a similar project?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Contact us to discuss your construction needs and how we can help bring your vision to life.
          </p>
          <Link
            href="/?section=contact"
            className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  )
}
