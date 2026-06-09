import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'

export type ProjectStatus = 'draft' | 'published' | 'archived'

export interface CreateProjectInput {
  title: string
  category: string
  categoryId?: string | null
  description: string
  location: string
  completedDate: Date
  coverImageUrl: string
  coverPosterUrl?: string | null
  galleryItems?: GalleryItem[]
}

export class Project {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly category: string
  readonly categoryId: string | null
  readonly description: string
  readonly location: string
  readonly completedDate: Date
  readonly featured: boolean
  readonly published: boolean
  readonly coverImageUrl: string
  readonly coverPosterUrl: string | null
  readonly galleryItems: GalleryItem[]
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    title: string
    category: string
    categoryId: string | null
    description: string
    location: string
    completedDate: Date
    featured: boolean
    published: boolean
    coverImageUrl: string
    coverPosterUrl: string | null
    galleryItems: GalleryItem[]
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.title = props.title
    this.category = props.category
    this.categoryId = props.categoryId
    this.description = props.description
    this.location = props.location
    this.completedDate = props.completedDate
    this.featured = props.featured
    this.published = props.published
    this.coverImageUrl = props.coverImageUrl
    this.coverPosterUrl = props.coverPosterUrl
    this.galleryItems = props.galleryItems
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateProjectInput): Project {
    const id = crypto.randomUUID()
    const slug = generateSlug(input.title)
    const now = new Date()

    return new Project({
      id,
      slug,
      title: input.title.trim(),
      category: input.category.trim(),
      categoryId: input.categoryId ?? null,
      description: input.description.trim(),
      location: input.location.trim(),
      completedDate: input.completedDate,
      featured: false,
      published: false,
      coverImageUrl: input.coverImageUrl.trim(),
      coverPosterUrl: input.coverPosterUrl ?? null,
      galleryItems: input.galleryItems || [],
      createdAt: now,
      updatedAt: now,
    })
  }

  withPublishedStatus(published: boolean): Project {
    return new Project({
      id: this.id,
      slug: this.slug,
      title: this.title,
      category: this.category,
      categoryId: this.categoryId,
      description: this.description,
      location: this.location,
      completedDate: this.completedDate,
      featured: this.featured,
      published,
      coverImageUrl: this.coverImageUrl,
      coverPosterUrl: this.coverPosterUrl,
      galleryItems: this.galleryItems,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  withFeaturedStatus(featured: boolean): Project {
    return new Project({
      id: this.id,
      slug: this.slug,
      title: this.title,
      category: this.category,
      categoryId: this.categoryId,
      description: this.description,
      location: this.location,
      completedDate: this.completedDate,
      featured,
      published: this.published,
      coverImageUrl: this.coverImageUrl,
      coverPosterUrl: this.coverPosterUrl,
      galleryItems: this.galleryItems,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    slug: string
    title: string
    category: string
    categoryId?: string | null
    description: string
    location: string
    completedDate: Date
    featured: boolean
    published: boolean
    coverImageUrl: string
    coverPosterUrl: string | null
    galleryItems: GalleryItem[]
    createdAt: Date
    updatedAt: Date
  }): Project {
    return new Project({ ...props, categoryId: props.categoryId ?? null })
  }
}
