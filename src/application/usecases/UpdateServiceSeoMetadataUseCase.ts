import { db } from '@/infrastructure/db/client'
import { services } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'

export interface UpdateServiceSeoMetadataInput {
  serviceId: string
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string[] | null
  noIndex?: boolean
}

export class UpdateServiceSeoMetadataUseCase {
  async execute(input: UpdateServiceSeoMetadataInput) {
    const { serviceId, metaTitle, metaDescription, metaKeywords, noIndex } = input

    const [updated] = await db
      .update(services)
      .set({
        metaTitle: metaTitle ?? undefined,
        metaDescription: metaDescription ?? undefined,
        metaKeywords: metaKeywords ?? undefined,
        noIndex: noIndex ?? undefined,
      })
      .where(eq(services.id, serviceId))
      .returning()

    if (!updated) {
      throw new Error(`Service with id ${serviceId} not found`)
    }

    return updated
  }
}
