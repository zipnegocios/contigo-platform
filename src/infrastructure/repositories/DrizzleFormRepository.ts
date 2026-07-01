import { count, desc, eq, max, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { forms, formVersions } from '../db/schema'
import type {
  IFormRepository,
  ActiveFormVersion,
  CreatedFormVersion,
  FormListItem,
  FormRow,
  FormVersionSummary,
} from '@/core/repositories/IFormRepository'
import type { FormSchema } from '@/core/form-schema/FormSchema'

const INITIAL_FORM_SCHEMA: FormSchema = {
  steps: [
    {
      fields: [
        {
          id: 'consent',
          type: 'consent_checkbox',
          label: 'I agree to be contacted',
          required: true,
        },
      ],
    },
  ],
}

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

  async findById(id: string): Promise<FormRow | null> {
    const rows = await db.select().from(forms).where(eq(forms.id, id)).limit(1)
    const form = rows[0]
    if (!form) return null
    return {
      id: form.id,
      name: form.name,
      slug: form.slug,
      activeVersionId: form.activeVersionId,
      createdAt: form.createdAt,
    }
  }

  async findAll(): Promise<FormListItem[]> {
    const rows = await db
      .select({
        id: forms.id,
        name: forms.name,
        slug: forms.slug,
        versionCount: count(formVersions.id),
        latestVersionAt: max(formVersions.createdAt),
      })
      .from(forms)
      .leftJoin(formVersions, eq(formVersions.formId, forms.id))
      .groupBy(forms.id)
      .orderBy(desc(forms.createdAt))

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      versionCount: Number(row.versionCount),
      latestVersionAt: row.latestVersionAt ? row.latestVersionAt.toISOString() : null,
    }))
  }

  async create(name: string, slug: string): Promise<FormRow> {
    return db.transaction(async (tx) => {
      const inserted = await tx
        .insert(forms)
        .values({ name, slug })
        .returning()

      const form = inserted[0]

      const versionInserted = await tx
        .insert(formVersions)
        .values({ formId: form.id, schema: INITIAL_FORM_SCHEMA, version: 1 })
        .returning({ id: formVersions.id })

      const versionId = versionInserted[0].id

      await tx.update(forms).set({ activeVersionId: versionId }).where(eq(forms.id, form.id))

      return {
        id: form.id,
        name: form.name,
        slug: form.slug,
        activeVersionId: versionId,
        createdAt: form.createdAt,
      }
    })
  }

  async update(slug: string, data: { name: string }): Promise<void> {
    await db.update(forms).set({ name: data.name }).where(eq(forms.slug, slug))
  }

  async hardDelete(slug: string): Promise<void> {
    await db.delete(forms).where(eq(forms.slug, slug))
  }

  async duplicate(slug: string, newName: string, newSlug: string): Promise<FormRow> {
    return db.transaction(async (tx) => {
      // Load source form + its active version schema
      const sourceRows = await tx.select().from(forms).where(eq(forms.slug, slug)).limit(1)
      const source = sourceRows[0]
      if (!source || !source.activeVersionId) throw new Error('Source form not found or has no active version')

      const sourceVersionRows = await tx
        .select()
        .from(formVersions)
        .where(eq(formVersions.id, source.activeVersionId))
        .limit(1)
      const sourceVersion = sourceVersionRows[0]
      if (!sourceVersion) throw new Error('Source active version not found')

      // Insert new form
      const newFormInserted = await tx
        .insert(forms)
        .values({ name: newName, slug: newSlug })
        .returning()
      const newForm = newFormInserted[0]

      // Insert schema as v1
      const newVersionInserted = await tx
        .insert(formVersions)
        .values({ formId: newForm.id, schema: sourceVersion.schema, version: 1 })
        .returning({ id: formVersions.id })
      const newVersionId = newVersionInserted[0].id

      // Set activeVersionId
      await tx.update(forms).set({ activeVersionId: newVersionId }).where(eq(forms.id, newForm.id))

      return {
        id: newForm.id,
        name: newForm.name,
        slug: newForm.slug,
        activeVersionId: newVersionId,
        createdAt: newForm.createdAt,
      }
    })
  }

  async findVersionsBySlug(slug: string): Promise<FormVersionSummary[]> {
    const formRows = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1)
    const form = formRows[0]
    if (!form) return []

    const versions = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.formId, form.id))
      .orderBy(desc(formVersions.version))

    return versions.map((v) => {
      const schema = v.schema as FormSchema
      const fieldCount = schema.steps[0]?.fields.length ?? 0
      return {
        id: v.id,
        version: v.version,
        fieldCount,
        createdAt: v.createdAt,
        isActive: v.id === form.activeVersionId,
      }
    })
  }

  async revertToVersion(slug: string, versionId: string): Promise<void> {
    const formRows = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1)
    const form = formRows[0]
    if (!form) throw new Error('Form not found')

    // Verify the version belongs to this form
    const versionRows = await db
      .select()
      .from(formVersions)
      .where(sql`${formVersions.id} = ${versionId} AND ${formVersions.formId} = ${form.id}`)
      .limit(1)

    if (!versionRows[0]) throw new Error('Version not found or does not belong to this form')

    await db.update(forms).set({ activeVersionId: versionId }).where(eq(forms.id, form.id))
  }

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
