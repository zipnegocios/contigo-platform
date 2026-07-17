import { eq, asc, and, isNull, isNotNull } from 'drizzle-orm'
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
        status: project.status,
        orderIndex: project.orderIndex,
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
      .where(isNull(projects.trashedAt))
      .orderBy(asc(projects.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findPublished(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.status, 'active'), isNull(projects.trashedAt)))
      .orderBy(asc(projects.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findFeatured(): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.status, 'active'), eq(projects.featured, true), isNull(projects.trashedAt)))
      .orderBy(asc(projects.orderIndex))

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findTrashed(): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(isNotNull(projects.trashedAt))
      .orderBy(asc(projects.title))

    return rows.map((row) => this.mapRowToProject(row))
  }

  async update(project: Project): Promise<void> {
    await db
      .update(projects)
      .set({
        slug: project.slug,
        title: project.title,
        category: project.category,
        categoryId: project.categoryId,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        status: project.status,
        coverImageUrl: project.coverImageUrl,
        coverPosterUrl: project.coverPosterUrl,
        galleryUrls: project.galleryItems,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
  }

  async updateOrder(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    for (const { id, orderIndex } of updates) {
      await db
        .update(projects)
        .set({ orderIndex, updatedAt: new Date() })
        .where(eq(projects.id, id))
    }
  }

  async trash(id: string): Promise<void> {
    await db.update(projects).set({ trashedAt: new Date() }).where(eq(projects.id, id))
  }

  async restore(id: string): Promise<void> {
    await db.update(projects).set({ trashedAt: null }).where(eq(projects.id, id))
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
      status: row.status as Project['status'],
      orderIndex: row.orderIndex as number,
      coverImageUrl: row.coverImageUrl as string,
      coverPosterUrl: (row.coverPosterUrl as string | null) ?? null,
      galleryItems: normaliseGalleryRow(row.galleryUrls),
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      trashedAt: (row.trashedAt as Date | null) ?? null,
    })
  }
}
