import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { Project } from '@/core/entities/Project'
import { Service } from '@/core/entities/Service'
import type { GalleryItem } from '@/types/media'

/**
 * Swaps every reference to `oldUrl` with `newUrl` across all projects and
 * services (coverImageUrl/coverPosterUrl/imageUrl/posterUrl and
 * galleryItems[].url). Used after a media object's key changes (rename,
 * optimize) so existing project/service references keep pointing at a
 * live object instead of a 404.
 */
export async function updateMediaUrlReferences(oldUrl: string, newUrl: string): Promise<void> {
  if (oldUrl === newUrl) return

  const projectRepo = new DrizzleProjectRepository()
  const serviceRepo = new DrizzleServiceRepository()

  const [projects, services] = await Promise.all([
    projectRepo.findAll(200),
    serviceRepo.findAll(200),
  ])

  const swapGallery = (items: GalleryItem[]) =>
    items.map((item) => (item.url === oldUrl ? { ...item, url: newUrl } : item))

  await Promise.all([
    ...projects
      .filter((p) =>
        p.coverImageUrl === oldUrl ||
        p.coverPosterUrl === oldUrl ||
        p.galleryItems.some((g) => g.url === oldUrl),
      )
      .map((p) =>
        projectRepo.update(
          Project.reconstruct({
            ...p,
            coverImageUrl: p.coverImageUrl === oldUrl ? newUrl : p.coverImageUrl,
            coverPosterUrl: p.coverPosterUrl === oldUrl ? newUrl : p.coverPosterUrl,
            galleryItems: swapGallery(p.galleryItems),
            updatedAt: new Date(),
          }),
        ),
      ),
    ...services
      .filter((s) =>
        s.imageUrl === oldUrl ||
        s.posterUrl === oldUrl ||
        s.galleryItems.some((g) => g.url === oldUrl),
      )
      .map((s) =>
        serviceRepo.update(
          Service.reconstruct({
            ...s,
            imageUrl: s.imageUrl === oldUrl ? newUrl : s.imageUrl,
            posterUrl: s.posterUrl === oldUrl ? newUrl : s.posterUrl,
            galleryItems: swapGallery(s.galleryItems),
            updatedAt: new Date(),
          }),
        ),
      ),
  ])
}
