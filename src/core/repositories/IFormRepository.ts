import type { FormSchema } from '@/core/form-schema/FormSchema'

/**
 * Result of resolving a form's currently-active version by its slug.
 */
export interface ActiveFormVersion {
  formId: string
  formVersionId: string
  schema: FormSchema
}

/**
 * Result of creating a new `form_versions` row (Task 4.2.4's versioned save
 * flow).
 */
export interface CreatedFormVersion {
  formVersionId: string
  version: number
}

/**
 * Repository for the Form Builder's `forms` / `form_versions` tables
 * (Fase 4.2). Task 4.2.3 only needed to resolve the active version for a
 * public-facing form by slug. Task 4.2.4 (the admin `<FormBuilder>`) adds
 * `findBySlug` (resolve a form's id without requiring an active version —
 * not strictly needed today since every seeded form has one, but a more
 * honest contract than reusing `findActiveVersionBySlug` for id-only
 * lookups) and `createNewVersion` (the versioned save: insert a brand new
 * `form_versions` row and repoint `forms.activeVersionId` at it, atomically
 * — an existing version row's `schema` is NEVER edited in place).
 */
export interface IFormRepository {
  findActiveVersionBySlug(slug: string): Promise<ActiveFormVersion | null>
  findBySlug(slug: string): Promise<{ formId: string } | null>
  createNewVersion(formId: string, schema: FormSchema): Promise<CreatedFormVersion>
}
