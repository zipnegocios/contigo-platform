import { revalidatePath } from 'next/cache'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleProjectSlugHistoryRepository } from '@/infrastructure/repositories/DrizzleProjectSlugHistoryRepository'
import { Project } from '@/core/entities/Project'
import { renamePrefix } from '@/infrastructure/services/R2StorageService'
import { generateSlug, ensureUniqueSlug } from '@/infrastructure/services/SlugGeneratorService'
import { resolveProjectCategorySlug } from '@/infrastructure/services/resolveProjectCategorySlug'
import type { GalleryItem } from '@/types/media'

const BUCKET = process.env.R2_ASSETS_BUCKET || 'contigo-assets'

// Defense-in-depth: `/`, `/projects` and `/projects/[category]/[slug]` are
// currently fully dynamic (force-dynamic / reads searchParams), so this is a
// no-op today — but it keeps admin mutations correct if those pages ever
// gain ISR.
function revalidateProjectPages(slug?: string, categorySlug?: string) {
  revalidatePath('/')
  revalidatePath('/projects')
  if (slug && categorySlug) revalidatePath(`/projects/${categorySlug}/${slug}`)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    return Response.json({
      id: project.id,
      title: project.title,
      slug: project.slug,
      coverImageUrl: project.coverImageUrl,
      coverPosterUrl: project.coverPosterUrl,
      galleryItems: project.galleryItems,
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    let newGalleryItems: GalleryItem[] =
      body.galleryItems !== undefined ? (body.galleryItems as GalleryItem[]) : project.galleryItems
    let newCoverImageUrl: string = body.coverImageUrl || project.coverImageUrl
    let newCoverPosterUrl: string | null =
      body.coverPosterUrl !== undefined ? body.coverPosterUrl : project.coverPosterUrl

    // Slug: a manual override (`body.slug`, from the admin's editable slug
    // field) always wins; otherwise it auto-regenerates from the title when
    // the title changes, same as before. Either way it's re-sanitized and
    // checked for uniqueness against every other project.
    const newTitle: string = body.title || project.title
    let candidateSlug: string
    if (typeof body.slug === 'string' && body.slug.trim() && generateSlug(body.slug) !== project.slug) {
      candidateSlug = generateSlug(body.slug)
    } else if (newTitle !== project.title) {
      candidateSlug = generateSlug(newTitle)
    } else {
      candidateSlug = project.slug
    }

    let newSlug = project.slug
    if (candidateSlug !== project.slug) {
      const allProjects = await projectRepo.findAll(1000)
      const existingSlugs = allProjects.filter((p) => p.id !== project.id).map((p) => p.slug)
      newSlug = ensureUniqueSlug(candidateSlug, existingSlugs)
    }

    if (newSlug !== project.slug) {
      const oldCoverPrefix = `projects/cover/${project.slug}`
      const newCoverPrefix = `projects/cover/${newSlug}`
      const oldGalleryPrefix = `projects/gallery/${project.slug}`
      const newGalleryPrefix = `projects/gallery/${newSlug}`

      const [coverMap, galleryMap] = await Promise.all([
        renamePrefix(BUCKET, oldCoverPrefix, newCoverPrefix),
        renamePrefix(BUCKET, oldGalleryPrefix, newGalleryPrefix),
      ])

      newCoverImageUrl = coverMap.get(newCoverImageUrl) ?? newCoverImageUrl
      newCoverPosterUrl = newCoverPosterUrl ? (coverMap.get(newCoverPosterUrl) ?? newCoverPosterUrl) : null
      newGalleryItems = newGalleryItems.map((item) => ({
        ...item,
        url: galleryMap.get(item.url) ?? item.url,
      }))
    }

    // When categoryId changes, resolve the category name to keep the
    // legacy varchar column in sync with the FK.
    const newCategoryId: string | null =
      body.categoryId !== undefined ? body.categoryId : project.categoryId
    let newCategoryName: string = body.category || project.category
    if (body.categoryId && body.categoryId !== project.categoryId) {
      const catRepo = new DrizzleCategoryRepository()
      const cat = await catRepo.findById(body.categoryId)
      if (cat) newCategoryName = cat.name
    }

    const updatedProject = Project.reconstruct({
      id: project.id,
      slug: newSlug,
      title: newTitle,
      category: newCategoryName,
      categoryId: newCategoryId,
      description: body.description || project.description,
      location: body.location || project.location,
      completedDate: body.completedDate ? new Date(body.completedDate) : project.completedDate,
      featured: body.featured !== undefined ? body.featured : project.featured,
      status: body.status !== undefined ? body.status : project.status,
      orderIndex: project.orderIndex,
      coverImageUrl: newCoverImageUrl,
      coverPosterUrl: newCoverPosterUrl,
      galleryItems: newGalleryItems,
      createdAt: project.createdAt,
      updatedAt: new Date(),
      trashedAt: project.trashedAt,
    })

    await projectRepo.update(updatedProject)

    if (updatedProject.slug !== project.slug) {
      await new DrizzleProjectSlugHistoryRepository().record(project.id, project.slug)
    }

    const newCategorySlug = await resolveProjectCategorySlug(updatedProject)
    revalidateProjectPages(updatedProject.slug, newCategorySlug)
    if (updatedProject.slug !== project.slug) {
      revalidateProjectPages(project.slug, await resolveProjectCategorySlug(project))
    }

    return Response.json({ success: true, slug: updatedProject.slug, category: newCategorySlug })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    await projectRepo.trash(id)
    revalidateProjectPages(project.slug, await resolveProjectCategorySlug(project))

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
