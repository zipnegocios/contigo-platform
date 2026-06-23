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
 * Repository for the Form Builder's `forms` / `form_versions` tables
 * (Fase 4.2). This task (4.2.3) only needs to resolve the active version
 * for a public-facing form by slug — methods for creating/listing versions
 * belong to a later task (4.2.4) and are intentionally not added here yet.
 */
export interface IFormRepository {
  findActiveVersionBySlug(slug: string): Promise<ActiveFormVersion | null>
}
