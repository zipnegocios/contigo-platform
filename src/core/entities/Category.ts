import type { CategoryType, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export class Category {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly parentId: string | null
  readonly type: CategoryType
  readonly description: string | null
  readonly icon: string | null
  readonly orderIndex: number
  readonly isActive: boolean
  readonly isSystem: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
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
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.name = props.name
    this.slug = props.slug
    this.parentId = props.parentId
    this.type = props.type
    this.description = props.description
    this.icon = props.icon
    this.orderIndex = props.orderIndex
    this.isActive = props.isActive
    this.isSystem = props.isSystem
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateCategoryInput): Category {
    const now = new Date()
    return new Category({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      slug: makeSlug(input.name),
      parentId: input.parentId ?? null,
      type: 'shared',
      description: input.description ?? null,
      icon: input.icon ?? null,
      orderIndex: 0,
      isActive: true,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    })
  }

  withUpdates(partial: UpdateCategoryInput): Category {
    const newName = partial.name !== undefined ? partial.name.trim() : this.name
    return new Category({
      id: this.id,
      name: newName,
      slug: partial.name !== undefined ? makeSlug(partial.name) : this.slug,
      parentId: partial.parentId !== undefined ? partial.parentId : this.parentId,
      type: this.type,
      description: partial.description !== undefined ? partial.description : this.description,
      icon: partial.icon !== undefined ? partial.icon : this.icon,
      orderIndex: this.orderIndex,
      isActive: partial.isActive !== undefined ? partial.isActive : this.isActive,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
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
    createdAt: Date
    updatedAt: Date
  }): Category {
    return new Category(props)
  }
}
