import { auth } from '@/infrastructure/auth/auth.config'
import { listObjects, deleteObject } from '@/infrastructure/services/R2StorageService'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { db } from '@/infrastructure/db/client'
import { mediaMetadata } from '@/infrastructure/db/schema'
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
    const withMetadata = searchParams.get('withMetadata') === '1'

    const objects = await listObjects(BUCKET, prefix)

    // Fetch DB metadata in parallel with associations when requested
    const [associationMap, metaByKey] = await Promise.all([
      withAssociations ? buildAssociationMap() : Promise.resolve(null),
      withMetadata || withAssociations
        ? db.select().from(mediaMetadata).then((rows) =>
            Object.fromEntries(rows.map((r) => [r.key, r]))
          )
        : Promise.resolve(null),
    ])

    const enriched = objects.map((obj) => ({
      ...obj,
      usedIn: associationMap ? (associationMap.get(obj.publicUrl) ?? []) : undefined,
      metadata: metaByKey ? (metaByKey[obj.key] ?? null) : undefined,
    }))

    return Response.json(enriched)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function buildAssociationMap(): Promise<Map<string, AssociationInfo[]>> {
  const [projects, services] = await Promise.all([
    new DrizzleProjectRepository().findAll(200),
    new DrizzleServiceRepository().findAll(200),
  ])

  const map = new Map<string, AssociationInfo[]>()

  const add = (url: string | null | undefined, info: AssociationInfo) => {
    if (!url) return
    const existing = map.get(url) ?? []
    map.set(url, [...existing, info])
  }

  for (const p of projects) {
    add(p.coverImageUrl, { entityType: 'project', title: p.title, field: 'cover' })
    add(p.coverPosterUrl, { entityType: 'project', title: p.title, field: 'poster' })
    for (const item of p.galleryItems ?? []) {
      add(item.url, { entityType: 'project', title: p.title, field: 'gallery' })
    }
  }

  for (const s of services) {
    add(s.imageUrl, { entityType: 'service', title: s.name, field: 'image' })
    add(s.posterUrl, { entityType: 'service', title: s.name, field: 'poster' })
    for (const item of s.galleryItems ?? []) {
      add(item.url, { entityType: 'service', title: s.name, field: 'gallery' })
    }
  }

  return map
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
