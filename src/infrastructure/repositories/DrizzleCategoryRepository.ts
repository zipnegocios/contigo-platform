import { eq, asc, and, or, isNull, isNotNull } from 'drizzle-orm'
import { db } from '../db/client'
import { categories } from '../db/schema'
import { Category } from '@/core/entities/Category'
import type { ICategoryRepository } from '@/core/repositories/ICategoryRepository'
import type { FlatCategory, CategoryType, ReorderItem } from '@/types/category'

type CategoryRow = typeof categories.$inferSelect

function mapToFlat(row: CategoryRow): FlatCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId ?? null,
    type: (row.type as CategoryType) ?? 'project',
    description: row.description ?? null,
    icon: row.icon ?? null,
    orderIndex: row.orderIndex,
    status: row.status,
    isSystem: row.isSystem,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapToEntity(row: CategoryRow): Category {
  return Category.reconstruct({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId ?? null,
    type: (row.type as CategoryType) ?? 'project',
    description: row.description ?? null,
    icon: row.icon ?? null,
    orderIndex: row.orderIndex,
    status: row.status,
    isSystem: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    trashedAt: row.trashedAt,
  })
}

export class DrizzleCategoryRepository implements ICategoryRepository {
  async findAll(type?: CategoryType, activeOnly: boolean = true): Promise<Category[]> {
    // When filtering by 'project' or 'service', also include 'shared' categories.
    const typeCondition = type
      ? type === 'shared'
        ? eq(categories.type, 'shared')
        : or(eq(categories.type, type), eq(categories.type, 'shared'))
      : undefined
    const conditions = [
      typeCondition,
      isNull(categories.trashedAt),
      activeOnly ? eq(categories.status, 'active') : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.orderIndex), asc(categories.name))
    return rows.map(mapToEntity)
  }

  async findFlat(type: CategoryType, activeOnly: boolean = true): Promise<FlatCategory[]> {
    // When filtering by 'project' or 'service', also include 'shared' categories.
    const typeCondition = type === 'shared'
      ? eq(categories.type, 'shared')
      : or(eq(categories.type, type), eq(categories.type, 'shared'))
    const conditions = [
      typeCondition,
      isNull(categories.trashedAt),
      activeOnly ? eq(categories.status, 'active') : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.orderIndex), asc(categories.name))
    return rows.map(mapToFlat)
  }

  async findTrashed(type?: CategoryType): Promise<Category[]> {
    const typeCondition = type
      ? type === 'shared'
        ? eq(categories.type, 'shared')
        : or(eq(categories.type, type), eq(categories.type, 'shared'))
      : undefined
    const conditions = [typeCondition, isNotNull(categories.trashedAt)]
      .filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.name))
    return rows.map(mapToEntity)
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async findBySlug(slug: string, type?: CategoryType): Promise<Category | null> {
    // When filtering by a specific type, also accept 'shared' categories.
    const condition = type
      ? and(eq(categories.slug, slug), or(eq(categories.type, type), eq(categories.type, 'shared')))
      : eq(categories.slug, slug)
    const rows = await db.select().from(categories).where(condition).limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async save(category: Category): Promise<void> {
    await db
      .insert(categories)
      .values({
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        type: category.type,
        description: category.description,
        icon: category.icon,
        orderIndex: category.orderIndex,
        status: category.status,
        isSystem: category.isSystem,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })
      .onConflictDoNothing()
  }

  async update(category: Category): Promise<void> {
    await db
      .update(categories)
      .set({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        description: category.description,
        icon: category.icon,
        orderIndex: category.orderIndex,
        status: category.status,
        updatedAt: category.updatedAt,
      })
      .where(eq(categories.id, category.id))
  }

  async reorder(updates: ReorderItem[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const item of updates) {
        await tx
          .update(categories)
          .set({
            orderIndex: item.orderIndex,
            parentId: item.parentId,
            updatedAt: new Date(),
          })
          .where(eq(categories.id, item.id))
      }
    })
  }

  async trash(id: string): Promise<void> {
    await db.update(categories).set({ trashedAt: new Date() }).where(eq(categories.id, id))
  }

  async restore(id: string): Promise<void> {
    await db.update(categories).set({ trashedAt: null }).where(eq(categories.id, id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id))
  }
}
