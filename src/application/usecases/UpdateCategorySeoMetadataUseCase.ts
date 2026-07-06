import { db } from '@/infrastructure/db/client'
import { categories } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'

export interface UpdateCategorySeoMetadataInput {
  categoryId: string
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string[] | null
}

export class UpdateCategorySeoMetadataUseCase {
  async execute(input: UpdateCategorySeoMetadataInput) {
    const { categoryId, metaTitle, metaDescription, metaKeywords } = input

    const [updated] = await db
      .update(categories)
      .set({
        metaTitle: metaTitle ?? undefined,
        metaDescription: metaDescription ?? undefined,
        metaKeywords: metaKeywords ?? undefined,
      })
      .where(eq(categories.id, categoryId))
      .returning()

    if (!updated) {
      throw new Error(`Category with id ${categoryId} not found`)
    }

    return updated
  }
}
