import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { categories, projects } from '../db/schema'
import { Category } from '@/core/entities/Category'
import { ICategoryRepository } from '@/core/repositories/ICategoryRepository'

export class DrizzleCategoryRepository implements ICategoryRepository {
  async findAll(): Promise<Category[]> {
    const rows = await db.select().from(categories).orderBy(categories.name)
    return rows.map(this.mapRow)
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return rows.length ? this.mapRow(rows[0]) : null
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1)
    return rows.length ? this.mapRow(rows[0]) : null
  }

  async save(category: Category): Promise<void> {
    await db.insert(categories).values({
      id: category.id,
      name: category.name,
      slug: category.slug,
      isSystem: category.isSystem,
      createdAt: category.createdAt,
    }).onConflictDoNothing()
  }

  async update(category: Category): Promise<void> {
    await db
      .update(categories)
      .set({ name: category.name, slug: category.slug })
      .where(eq(categories.id, category.id))
  }

  async delete(id: string, reassignName: string): Promise<void> {
    const row = await this.findById(id)
    if (!row) return

    // Reassign all projects in this category to the fallback category name
    await db
      .update(projects)
      .set({ category: reassignName })
      .where(eq(projects.category, row.name))

    await db.delete(categories).where(eq(categories.id, id))
  }

  private mapRow(row: typeof categories.$inferSelect): Category {
    return Category.reconstruct({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
    })
  }
}
