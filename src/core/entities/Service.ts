import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'

export interface CreateServiceInput {
  name: string
  shortDescription: string
  fullDescription: string
  imageUrl: string
  orderIndex?: number
}

export class Service {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly shortDescription: string
  readonly fullDescription: string
  readonly imageUrl: string
  readonly orderIndex: number
  readonly published: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    orderIndex: number
    published: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.name = props.name
    this.shortDescription = props.shortDescription
    this.fullDescription = props.fullDescription
    this.imageUrl = props.imageUrl
    this.orderIndex = props.orderIndex
    this.published = props.published
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateServiceInput): Service {
    const id = crypto.randomUUID()
    const slug = generateSlug(input.name)
    const now = new Date()

    return new Service({
      id,
      slug,
      name: input.name.trim(),
      shortDescription: input.shortDescription.trim(),
      fullDescription: input.fullDescription.trim(),
      imageUrl: input.imageUrl.trim(),
      orderIndex: input.orderIndex || 0,
      published: true,
      createdAt: now,
      updatedAt: now,
    })
  }

  withOrder(orderIndex: number): Service {
    return new Service({
      id: this.id,
      slug: this.slug,
      name: this.name,
      shortDescription: this.shortDescription,
      fullDescription: this.fullDescription,
      imageUrl: this.imageUrl,
      orderIndex,
      published: this.published,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }
}
