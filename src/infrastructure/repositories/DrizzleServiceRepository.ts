import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client'
import { services } from '../db/schema'
import { Service } from '@/core/entities/Service'

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
        orderIndex: service.orderIndex,
        published: service.published,
      })
      .onConflictDoNothing()
  }

  async findById(id: string): Promise<Service | null> {
    const rows = await db.select().from(services).where(eq(services.id, id)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToService(rows[0])
  }

  async findAll(limit = 100, offset = 0): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .orderBy(asc(services.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToService(row))
  }

  async findPublished(): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.published, true))
      .orderBy(asc(services.orderIndex))

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
        orderIndex: service.orderIndex,
        published: service.published,
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

  async delete(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id))
  }

  private mapRowToService(row: any): Service {
    return Service.reconstruct({
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.shortDescription,
      fullDescription: row.fullDescription,
      imageUrl: row.imageUrl,
      orderIndex: row.orderIndex,
      published: row.published,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
