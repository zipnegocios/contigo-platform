export interface GalleryItem {
  url: string
  title?: string
  description?: string
  order: number
}

export interface AssociationInfo {
  entityType: 'project' | 'service'
  title: string
  field: 'cover' | 'gallery' | 'poster' | 'image'
}
