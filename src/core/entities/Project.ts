import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'

export type ProjectStatus = 'draft' | 'published' | 'archived'

export interface CreateProjectInput {
  title: string
  category: string
  description: string
  location: string
  completedDate: Date
  coverImageUrl: string
  galleryUrls?: string[]
}

export class Project {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly category: string
  readonly description: string
  readonly location: string
  readonly completedDate: Date
  readonly featured: boolean
  readonly published: boolean
  readonly coverImageUrl: string
  readonly galleryUrls: string[]
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    title: string
    category: string
    description: string
    location: string
    completedDate: Date
    featured: boolean
    published: boolean
    coverImageUrl: string
    galleryUrls: string[]
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.title = props.title
    this.category = props.category
    this.description = props.description
    this.location = props.location
    this.completedDate = props.completedDate
    this.featured = props.featured
    this.published = props.published
    this.coverImageUrl = props.coverImageUrl
    this.galleryUrls = props.galleryUrls
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
      description: input.description.trim(),
      location: input.location.trim(),
      completedDate: input.completedDate,
      featured: false,
      published: false,
      coverImageUrl: input.coverImageUrl.trim(),
      galleryUrls: input.galleryUrls || [],
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
      description: this.description,
      location: this.location,
      completedDate: this.completedDate,
      featured: this.featured,
      published,
      coverImageUrl: this.coverImageUrl,
      galleryUrls: this.galleryUrls,
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
      description: this.description,
      location: this.location,
      completedDate: this.completedDate,
      featured,
      published: this.published,
      coverImageUrl: this.coverImageUrl,
      galleryUrls: this.galleryUrls,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }
}
