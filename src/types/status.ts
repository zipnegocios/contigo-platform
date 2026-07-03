export type ContentStatus = 'draft' | 'active' | 'inactive'

export const CONTENT_STATUS_OPTIONS: ContentStatus[] = ['active', 'draft', 'inactive']

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  inactive: 'Inactive',
}
