import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { forms, formVersions } from '../db/schema'
import { IFormRepository, ActiveFormVersion } from '@/core/repositories/IFormRepository'
import type { FormSchema } from '@/core/form-schema/FormSchema'

export class DrizzleFormRepository implements IFormRepository {
  async findActiveVersionBySlug(slug: string): Promise<ActiveFormVersion | null> {
    const formRows = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1)

    const form = formRows[0]
    if (!form || !form.activeVersionId) return null

    const versionRows = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.id, form.activeVersionId))
      .limit(1)

    const version = versionRows[0]
    if (!version) return null

    return {
      formId: form.id,
      formVersionId: version.id,
      schema: version.schema as FormSchema,
    }
  }
}
