import { auth } from '@/infrastructure/auth/auth.config'
import { listObjects, deleteObject } from '@/infrastructure/services/R2StorageService'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import type { AssociationInfo } from '@/types/media'

export type { AssociationInfo }

const BUCKET = process.env.R2_ASSETS_BUCKET || 'contigo-assets'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') ?? undefined
    const withAssociations = searchParams.get('withAssociations') === '1'

    const objects = await listObjects(BUCKET, prefix)

    if (!withAssociations) {
      return Response.json(objects)
    }

    // Build a URL→association map from DB data
    const [projects, services] = await Promise.all([
      new DrizzleProjectRepository().findAll(200),
      new DrizzleServiceRepository().findAll(200),
    ])

    const associationMap = new Map<string, AssociationInfo[]>()

    const addAssociation = (url: string, info: AssociationInfo) => {
      if (!url) return
      const existing = associationMap.get(url) ?? []
      associationMap.set(url, [...existing, info])
    }

    for (const p of projects) {
      if (p.coverImageUrl) {
        addAssociation(p.coverImageUrl, { entityType: 'project', title: p.title, field: 'cover' })
      }
      for (const url of p.galleryUrls ?? []) {
        addAssociation(url, { entityType: 'project', title: p.title, field: 'gallery' })
      }
    }

    for (const s of services) {
      if (s.imageUrl) {
        addAssociation(s.imageUrl, { entityType: 'service', title: s.name, field: 'image' })
      }
    }

    const enriched = objects.map((obj) => ({
      ...obj,
      usedIn: associationMap.get(obj.publicUrl) ?? [],
    }))

    return Response.json(enriched)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { key } = await request.json()
    if (!key || typeof key !== 'string') {
      return Response.json({ error: 'key is required' }, { status: 400 })
    }

    await deleteObject(BUCKET, key)
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
