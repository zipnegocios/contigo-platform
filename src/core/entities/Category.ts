export class Category {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly isSystem: boolean
  readonly createdAt: Date

  private constructor(props: {
    id: string
    name: string
    slug: string
    isSystem: boolean
    createdAt: Date
  }) {
    this.id = props.id
    this.name = props.name
    this.slug = props.slug
    this.isSystem = props.isSystem
    this.createdAt = props.createdAt
  }

  static create(name: string): Category {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    return new Category({
      id: crypto.randomUUID(),
      name: name.trim(),
      slug,
      isSystem: false,
      createdAt: new Date(),
    })
  }

  withName(name: string): Category {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    return new Category({
      id: this.id,
      name: name.trim(),
      slug,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
    })
  }

  static reconstruct(props: {
    id: string
    name: string
    slug: string
    isSystem: boolean
    createdAt: Date
  }): Category {
    return new Category(props)
  }
}
