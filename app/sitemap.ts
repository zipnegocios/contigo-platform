import { MetadataRoute } from 'next'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { resolveProjectCategorySlug } from '@/infrastructure/services/resolveProjectCategorySlug'
import { SERVICE_ROOT_SLUGS } from '@/presentation/data/serviceCategoryMeta'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://contigoconstructions.com.au'
  const now = new Date()

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // Add legal documents (only slugs with a live published version)
  try {
    if (process.env.DATABASE_URL) {
      const documents = await new ListLegalDocumentsUseCase(new DrizzleLegalDocumentRepository()).published()
      routes.push({
        url: `${baseUrl}/legal`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.3,
      })
      for (const doc of documents) {
        routes.push({
          url: `${baseUrl}/legal/${doc.slug}`,
          lastModified: doc.effectiveDate ?? doc.updatedAt,
          changeFrequency: 'yearly',
          priority: 0.3,
        })
      }
    }
  } catch (error) {
    console.error('sitemap legal documents error:', error)
  }

  // Add service categories and items dynamically
  try {
    if (process.env.DATABASE_URL) {
      const categoryRepo = new DrizzleCategoryRepository()
      const serviceRepo = new DrizzleServiceRepository()

      for (const slug of SERVICE_ROOT_SLUGS) {
        const cat = await categoryRepo.findBySlug(slug, 'shared')
        if (cat && cat.status === 'active' && !cat.trashedAt) {
          // Add category page
          routes.push({
            url: `${baseUrl}/services/${slug}`,
            lastModified: cat.updatedAt || now,
            changeFrequency: 'weekly',
            priority: 0.9,
          })

          // Add all published services in this category, excluding noIndex
          const allServices = await serviceRepo.findAll(100)
          const matched = allServices.filter(
            (s) =>
              s.categoryId === cat.id &&
              s.status === 'active' &&
              !s.trashedAt &&
              !s.noIndex, // EXCLUDE noIndex services
          )

          for (const service of matched) {
            routes.push({
              url: `${baseUrl}/services/${slug}/${service.slug}`,
              lastModified: service.updatedAt || now,
              changeFrequency: 'monthly',
              priority: 0.7,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('sitemap generation error:', error)
    // Return base routes on error, don't crash
  }

  // Add individual published projects
  try {
    if (process.env.DATABASE_URL) {
      const projects = await new DrizzleProjectRepository().findPublished(200)
      for (const project of projects) {
        const categorySlug = await resolveProjectCategorySlug(project)
        routes.push({
          url: `${baseUrl}/projects/${categorySlug}/${project.slug}`,
          lastModified: project.updatedAt || now,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }
  } catch (error) {
    console.error('sitemap projects error:', error)
  }

  return routes
}
