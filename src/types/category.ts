export type CategoryType = 'project' | 'service'

export interface FlatCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  type: CategoryType
  description: string | null
  icon: string | null
  orderIndex: number
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryNode extends FlatCategory {
  children: CategoryNode[]
}

export interface CreateCategoryInput {
  name: string
  type: CategoryType
  parentId?: string | null
  description?: string | null
  icon?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  parentId?: string | null
  description?: string | null
  icon?: string | null
  isActive?: boolean
}

export interface ReorderItem {
  id: string
  orderIndex: number
  parentId: string | null
}
