import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'
import type { ContentStatus } from '@/types/status'

export interface CreateServiceInput {
  name: string
  /** Optional manual override — caller is responsible for sanitizing/uniqueness (see admin create route). */
  slug?: string
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
  readonly status: ContentStatus
  readonly pageBlocks: PageBlock[] | null
  readonly metaTitle: string | null
  readonly metaDescription: string | null
  readonly metaKeywords: string[] | null
  readonly noIndex: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly trashedAt: Date | null

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
    status: ContentStatus
    pageBlocks: PageBlock[] | null
    metaTitle: string | null
    metaDescription: string | null
    metaKeywords: string[] | null
    noIndex: boolean
    createdAt: Date
    updatedAt: Date
    trashedAt: Date | null
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
    this.status = props.status
    this.pageBlocks = props.pageBlocks
    this.metaTitle = props.metaTitle
    this.metaDescription = props.metaDescription
    this.metaKeywords = props.metaKeywords
    this.noIndex = props.noIndex
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.trashedAt = props.trashedAt
  }

  static create(input: CreateServiceInput): Service {
    const id = crypto.randomUUID()
    const slug = input.slug ? generateSlug(input.slug) : generateSlug(input.name)
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
      status: 'active',
      pageBlocks: input.pageBlocks ?? null,
      metaTitle: null,
      metaDescription: null,
      metaKeywords: null,
      noIndex: false,
      createdAt: now,
      updatedAt: now,
      trashedAt: null,
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
      status: this.status,
      pageBlocks: this.pageBlocks,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      metaKeywords: this.metaKeywords,
      noIndex: this.noIndex,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      trashedAt: this.trashedAt,
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
    status: ContentStatus
    pageBlocks: PageBlock[] | null
    metaTitle: string | null
    metaDescription: string | null
    metaKeywords: string[] | null
    noIndex: boolean
    createdAt: Date
    updatedAt: Date
    trashedAt: Date | null
  }): Service {
    return new Service({ ...props, categoryId: props.categoryId ?? null })
  }
}
