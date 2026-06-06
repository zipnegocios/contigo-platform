import { eq, desc, and } from 'drizzle-orm'
import { db } from '../db/client'
import { projects } from '../db/schema'
import { Project } from '@/core/entities/Project'

export class DrizzleProjectRepository {
  async save(project: Project): Promise<void> {
    await db
      .insert(projects)
      .values({
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        published: project.published,
        coverImageUrl: project.coverImageUrl,
        galleryUrls: project.galleryUrls,
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
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        published: project.published,
        coverImageUrl: project.coverImageUrl,
        galleryUrls: project.galleryUrls,
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

  private mapRowToProject(row: any): Project {
    return Project.reconstruct({
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      description: row.description,
      location: row.location,
      completedDate: row.completedDate,
      featured: row.featured,
      published: row.published,
      coverImageUrl: row.coverImageUrl,
      galleryUrls: row.galleryUrls || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
