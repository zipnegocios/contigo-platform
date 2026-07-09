import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { reviewRequestTemplates } from '../db/schema'
import { ReviewRequestTemplate } from '@/core/entities/ReviewRequestTemplate'
import { IReviewRequestTemplateRepository } from '@/core/repositories/IReviewRequestTemplateRepository'

type ReviewRequestTemplateRow = typeof reviewRequestTemplates.$inferSelect

function mapRow(row: ReviewRequestTemplateRow): ReviewRequestTemplate {
  return ReviewRequestTemplate.reconstruct({
    id: row.id,
    name: row.name,
    subject: row.subject,
    bodyHtml: row.bodyHtml,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class DrizzleReviewRequestTemplateRepository implements IReviewRequestTemplateRepository {
  async save(template: ReviewRequestTemplate): Promise<void> {
    await db.insert(reviewRequestTemplates).values({
      id: template.id,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      isDefault: template.isDefault,
    })
  }

  async update(template: ReviewRequestTemplate): Promise<void> {
    await db
      .update(reviewRequestTemplates)
      .set({
        name: template.name,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        isDefault: template.isDefault,
        updatedAt: template.updatedAt,
      })
      .where(eq(reviewRequestTemplates.id, template.id))
  }

  async findById(id: string): Promise<ReviewRequestTemplate | null> {
    const rows = await db.select().from(reviewRequestTemplates).where(eq(reviewRequestTemplates.id, id)).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }

  async findDefault(): Promise<ReviewRequestTemplate | null> {
    const rows = await db.select().from(reviewRequestTemplates).where(eq(reviewRequestTemplates.isDefault, true)).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }

  async findAll(): Promise<ReviewRequestTemplate[]> {
    const rows = await db.select().from(reviewRequestTemplates)
    return rows.map(mapRow)
  }
}
