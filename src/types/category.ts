import type { ContentStatus } from '@/types/status'

export type CategoryType = 'shared'
export type CategoryStatus = ContentStatus

export interface FlatCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  type: CategoryType
  description: string | null
  icon: string | null
  orderIndex: number
  status: CategoryStatus
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryNode extends FlatCategory {
  children: CategoryNode[]
}

export interface CreateCategoryInput {
  name: string
  parentId?: string | null
  description?: string | null
  icon?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  parentId?: string | null
  description?: string | null
  icon?: string | null
  status?: CategoryStatus
}

export interface ReorderItem {
  id: string
  orderIndex: number
  parentId: string | null
}
