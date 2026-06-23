import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { forms, formVersions } from '../db/schema'
import { IFormRepository, ActiveFormVersion, CreatedFormVersion } from '@/core/repositories/IFormRepository'
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

  async findBySlug(slug: string): Promise<{ formId: string } | null> {
    const formRows = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1)

    const form = formRows[0]
    if (!form) return null

    return { formId: form.id }
  }

  /**
   * Versioned save (Task 4.2.4): inserts a brand new `form_versions` row and
   * repoints `forms.activeVersionId` at it — all inside one transaction so a
   * failure partway through never leaves `forms.activeVersionId` pointing at
   * a version that doesn't exist, nor a new version row that no form points
   * to. The next version number is `1 + (highest existing version for this
   * formId)`, so it never collides with an existing row even if versions
   * were ever deleted out of order. An existing `form_versions` row's
   * `schema` is never updated — every save is a brand new row.
   */
  async createNewVersion(formId: string, schema: FormSchema): Promise<CreatedFormVersion> {
    return db.transaction(async (tx) => {
      const latest = await tx
        .select({ version: formVersions.version })
        .from(formVersions)
        .where(eq(formVersions.formId, formId))
        .orderBy(desc(formVersions.version))
        .limit(1)

      const nextVersion = (latest[0]?.version ?? 0) + 1

      const inserted = await tx
        .insert(formVersions)
        .values({ formId, schema, version: nextVersion })
        .returning({ id: formVersions.id })

      const formVersionId = inserted[0].id

      await tx.update(forms).set({ activeVersionId: formVersionId }).where(eq(forms.id, formId))

      return { formVersionId, version: nextVersion }
    })
  }
}
