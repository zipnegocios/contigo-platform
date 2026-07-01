import type { FormSchema } from '@/core/form-schema/FormSchema'

export interface ActiveFormVersion {
  formId: string
  formVersionId: string
  schema: FormSchema
}

export interface CreatedFormVersion {
  formVersionId: string
  version: number
}

export interface FormListItem {
  id: string
  name: string
  slug: string
  versionCount: number
  latestVersionAt: string | null
}

export interface FormRow {
  id: string
  name: string
  slug: string
  activeVersionId: string | null
  createdAt: Date
}

export interface FormVersionSummary {
  id: string
  version: number
  fieldCount: number
  createdAt: Date
  isActive: boolean
}

export interface IFormRepository {
  findActiveVersionBySlug(slug: string): Promise<ActiveFormVersion | null>
  findBySlug(slug: string): Promise<{ formId: string } | null>
  findById(id: string): Promise<FormRow | null>
  findAll(): Promise<FormListItem[]>
  create(name: string, slug: string): Promise<FormRow>
  update(slug: string, data: { name: string }): Promise<void>
  hardDelete(slug: string): Promise<void>
  duplicate(slug: string, newName: string, newSlug: string): Promise<FormRow>
  findVersionsBySlug(slug: string): Promise<FormVersionSummary[]>
  revertToVersion(slug: string, versionId: string): Promise<void>
  createNewVersion(formId: string, schema: FormSchema): Promise<CreatedFormVersion>
}
