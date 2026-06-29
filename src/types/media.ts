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

export interface MediaFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
}

export interface MediaTag {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface MediaMetadata {
  id: string
  key: string
  folderId: string | null
  tags: string[]
  notes: string | null
  width: number | null
  height: number | null
  duration: number | null
  format: string | null
  optimized: boolean
}
