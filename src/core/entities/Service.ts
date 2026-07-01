import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'

export interface CreateServiceInput {
  name: string
  shortDescription: string
  fullDescription: string
  imageUrl: string
  posterUrl?: string | null
  galleryItems?: GalleryItem[]
  orderIndex?: number
  categoryId?: string | null
  pageBlocks?: PageBlock[] | null
}

export class Service {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly shortDescription: string
  readonly fullDescription: string
  readonly imageUrl: string
  readonly posterUrl: string | null
  readonly galleryItems: GalleryItem[]
  readonly orderIndex: number
  readonly categoryId: string | null
  readonly published: boolean
  readonly pageBlocks: PageBlock[] | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    posterUrl: string | null
    galleryItems: GalleryItem[]
    orderIndex: number
    categoryId: string | null
    published: boolean
    pageBlocks: PageBlock[] | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.name = props.name
    this.shortDescription = props.shortDescription
    this.fullDescription = props.fullDescription
    this.imageUrl = props.imageUrl
    this.posterUrl = props.posterUrl
    this.galleryItems = props.galleryItems
    this.orderIndex = props.orderIndex
    this.categoryId = props.categoryId
    this.published = props.published
    this.pageBlocks = props.pageBlocks
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
      posterUrl: input.posterUrl ?? null,
      galleryItems: input.galleryItems || [],
      orderIndex: input.orderIndex || 0,
      categoryId: input.categoryId ?? null,
      published: true,
      pageBlocks: input.pageBlocks ?? null,
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
      posterUrl: this.posterUrl,
      galleryItems: this.galleryItems,
      orderIndex,
      categoryId: this.categoryId,
      published: this.published,
      pageBlocks: this.pageBlocks,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    slug: string
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    posterUrl: string | null
    galleryItems: GalleryItem[]
    orderIndex: number
    categoryId?: string | null
    published: boolean
    pageBlocks: PageBlock[] | null
    createdAt: Date
    updatedAt: Date
  }): Service {
    return new Service({ ...props, categoryId: props.categoryId ?? null })
  }
}
