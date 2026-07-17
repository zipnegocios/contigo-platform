import { revalidatePath } from 'next/cache'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { Project } from '@/core/entities/Project'
import { generateSlug, ensureUniqueSlug } from '@/infrastructure/services/SlugGeneratorService'
import { resolveProjectCategorySlug } from '@/infrastructure/services/resolveProjectCategorySlug'
import type { GalleryItem } from '@/types/media'

// Defense-in-depth: `/`, `/projects` and `/projects/[category]/[slug]` are
// currently fully dynamic (force-dynamic / reads searchParams), so this is a
// no-op today — but it keeps admin mutations correct if those pages ever
// gain ISR.
function revalidateProjectPages(slug?: string, categorySlug?: string) {
  revalidatePath('/')
  revalidatePath('/projects')
  if (slug && categorySlug) revalidatePath(`/projects/${categorySlug}/${slug}`)
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectRepo = new DrizzleProjectRepository()
    const [projects, categories] = await Promise.all([
      projectRepo.findAll(200),
      new DrizzleCategoryRepository().findFlat('shared'),
    ])
    const categorySlugById = new Map(categories.map((c) => [c.id, c.slug]))

    const mapped = projects.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      coverImageUrl: p.coverImageUrl,
      categorySlug: (p.categoryId && categorySlugById.get(p.categoryId)) || generateSlug(p.category),
    }))

    return Response.json(mapped)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body

    const projectRepo = new DrizzleProjectRepository()
    await projectRepo.updateOrder(updates)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const projectRepo = new DrizzleProjectRepository()

    const baseSlug = generateSlug(typeof body.slug === 'string' && body.slug.trim() ? body.slug : body.title)
    const existingSlugs = (await projectRepo.findAll(1000)).map((p) => p.slug)
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs)

    const project = Project.create({
      title: body.title,
      slug: uniqueSlug,
      category: body.category,
      categoryId: body.categoryId ?? null,
      description: body.description,
      location: body.location,
      completedDate: new Date(body.completedDate),
      coverImageUrl: body.coverImageUrl,
      coverPosterUrl: body.coverPosterUrl ?? null,
      galleryItems: (body.galleryItems as GalleryItem[]) || [],
    })

    await projectRepo.save(project)
    revalidateProjectPages(project.slug, await resolveProjectCategorySlug(project))

    return Response.json({ id: project.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
