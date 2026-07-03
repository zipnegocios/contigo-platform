import { eq, asc, and, isNull, isNotNull } from 'drizzle-orm'
import { db } from '../db/client'
import { services } from '../db/schema'
import { Service } from '@/core/entities/Service'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'

function normaliseGalleryRow(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, idx) => {
    if (typeof item === 'string') return { url: item, order: idx }
    if (item && typeof item === 'object' && 'url' in item) return item as GalleryItem
    return { url: String(item), order: idx }
  })
}

export class DrizzleServiceRepository {
  async save(service: Service): Promise<void> {
    await db
      .insert(services)
      .values({
        id: service.id,
        slug: service.slug,
        name: service.name,
        shortDescription: service.shortDescription,
        fullDescription: service.fullDescription,
        imageUrl: service.imageUrl,
        posterUrl: service.posterUrl,
        galleryItems: service.galleryItems,
        orderIndex: service.orderIndex,
        categoryId: service.categoryId,
        status: service.status,
        pageBlocks: service.pageBlocks,
      })
      .onConflictDoNothing()
  }

  async findById(id: string): Promise<Service | null> {
    const rows = await db.select().from(services).where(eq(services.id, id)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToService(rows[0])
  }

  async findBySlug(slug: string): Promise<Service | null> {
    const rows = await db.select().from(services).where(eq(services.slug, slug)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToService(rows[0])
  }

  async findAll(limit = 100, offset = 0): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .where(isNull(services.trashedAt))
      .orderBy(asc(services.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToService(row))
  }

  async findPublished(): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .where(and(eq(services.status, 'active'), isNull(services.trashedAt)))
      .orderBy(asc(services.orderIndex))

    return rows.map((row) => this.mapRowToService(row))
  }

  async findTrashed(): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .where(isNotNull(services.trashedAt))
      .orderBy(asc(services.name))

    return rows.map((row) => this.mapRowToService(row))
  }

  async update(service: Service): Promise<void> {
    await db
      .update(services)
      .set({
        name: service.name,
        shortDescription: service.shortDescription,
        fullDescription: service.fullDescription,
        imageUrl: service.imageUrl,
        posterUrl: service.posterUrl,
        galleryItems: service.galleryItems,
        orderIndex: service.orderIndex,
        categoryId: service.categoryId,
        status: service.status,
        pageBlocks: service.pageBlocks,
        updatedAt: new Date(),
      })
      .where(eq(services.id, service.id))
  }

  async updateOrder(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    for (const { id, orderIndex } of updates) {
      await db
        .update(services)
        .set({ orderIndex, updatedAt: new Date() })
        .where(eq(services.id, id))
    }
  }

  async trash(id: string): Promise<void> {
    await db.update(services).set({ trashedAt: new Date() }).where(eq(services.id, id))
  }

  async restore(id: string): Promise<void> {
    await db.update(services).set({ trashedAt: null }).where(eq(services.id, id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id))
  }

  private mapRowToService(row: Record<string, unknown>): Service {
    return Service.reconstruct({
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      shortDescription: row.shortDescription as string,
      fullDescription: row.fullDescription as string,
      imageUrl: row.imageUrl as string,
      posterUrl: (row.posterUrl as string | null) ?? null,
      galleryItems: normaliseGalleryRow(row.galleryItems),
      orderIndex: row.orderIndex as number,
      categoryId: (row.categoryId as string | null) ?? null,
      status: row.status as Service['status'],
      pageBlocks: (row.pageBlocks as PageBlock[] | null) ?? null,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      trashedAt: (row.trashedAt as Date | null) ?? null,
    })
  }
}
