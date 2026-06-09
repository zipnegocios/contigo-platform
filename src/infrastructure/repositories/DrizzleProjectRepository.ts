import { eq, desc, and } from 'drizzle-orm'
import { db } from '../db/client'
import { projects } from '../db/schema'
import { Project } from '@/core/entities/Project'
import type { GalleryItem } from '@/types/media'

function normaliseGalleryRow(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, idx) => {
    if (typeof item === 'string') return { url: item, order: idx }
    if (item && typeof item === 'object' && 'url' in item) return item as GalleryItem
    return { url: String(item), order: idx }
  })
}

export class DrizzleProjectRepository {
  async save(project: Project): Promise<void> {
    await db
      .insert(projects)
      .values({
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        categoryId: project.categoryId,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        published: project.published,
        coverImageUrl: project.coverImageUrl,
        coverPosterUrl: project.coverPosterUrl,
        galleryUrls: project.galleryItems,
      })
      .onConflictDoNothing()
  }

  async findById(id: string): Promise<Project | null> {
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToProject(rows[0])
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToProject(rows[0])
  }

  async findAll(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findPublished(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findFeatured(): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.published, true), eq(projects.featured, true)))
      .orderBy(desc(projects.createdAt))
      .limit(5)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async update(project: Project): Promise<void> {
    await db
      .update(projects)
      .set({
        title: project.title,
        category: project.category,
        categoryId: project.categoryId,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        published: project.published,
        coverImageUrl: project.coverImageUrl,
        coverPosterUrl: project.coverPosterUrl,
        galleryUrls: project.galleryItems,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id))
  }

  async exists(slug: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1)

    return rows.length > 0
  }

  private mapRowToProject(row: Record<string, unknown>): Project {
    return Project.reconstruct({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      category: row.category as string,
      categoryId: (row.categoryId as string | null) ?? null,
      description: row.description as string,
      location: row.location as string,
      completedDate: row.completedDate as Date,
      featured: row.featured as boolean,
      published: row.published as boolean,
      coverImageUrl: row.coverImageUrl as string,
      coverPosterUrl: (row.coverPosterUrl as string | null) ?? null,
      galleryItems: normaliseGalleryRow(row.galleryUrls),
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    })
  }
}
