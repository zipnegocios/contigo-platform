import sharp from 'sharp'
import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import { mediaMetadata } from '@/infrastructure/db/schema'
import { eq, sql } from 'drizzle-orm'
import { inferMediaType } from '@/core/lib/inferMediaType'
import { getObjectBuffer, putObjectBuffer, deleteObject } from '@/infrastructure/services/R2StorageService'
import { updateMediaUrlReferences } from '@/infrastructure/services/MediaReferenceService'

const BUCKET = process.env.R2_ASSETS_BUCKET || 'contigo-assets'
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'
const WEBP_QUALITY = 80 // adjustable constant — not user-configurable for now

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { key: oldKey } = await request.json()
    if (!oldKey || typeof oldKey !== 'string') {
      return Response.json({ error: 'key is required' }, { status: 400 })
    }

    if (inferMediaType(oldKey) !== 'image') {
      return Response.json({ error: 'Only images can be optimized' }, { status: 400 })
    }

    const lastSlash = oldKey.lastIndexOf('/')
    const dir = lastSlash >= 0 ? oldKey.slice(0, lastSlash + 1) : ''
    const oldBasename = lastSlash >= 0 ? oldKey.slice(lastSlash + 1) : oldKey
    const lastDot = oldBasename.lastIndexOf('.')
    const baseNoExt = lastDot > 0 ? oldBasename.slice(0, lastDot) : oldBasename
    const newKey = `${dir}${baseNoExt}.webp`

    const originalBuffer = await getObjectBuffer(BUCKET, oldKey)
    const optimizedBuffer = await sharp(originalBuffer).webp({ quality: WEBP_QUALITY }).toBuffer()

    await putObjectBuffer(BUCKET, newKey, optimizedBuffer, 'image/webp')

    const sameKey = newKey === oldKey
    if (!sameKey) {
      await deleteObject(BUCKET, oldKey)
    }

    const newPublicUrl = `${ASSETS_URL}/${newKey}`
    const oldPublicUrl = `${ASSETS_URL}/${oldKey}`

    if (!sameKey) {
      // Migrate metadata row to the new key, or insert fresh if none existed.
      const [existingMeta] = await db
        .select({ id: mediaMetadata.id })
        .from(mediaMetadata)
        .where(eq(mediaMetadata.key, oldKey))

      if (existingMeta) {
        await db
          .update(mediaMetadata)
          .set({ key: newKey, optimized: true, format: 'image/webp', updatedAt: new Date() })
          .where(eq(mediaMetadata.key, oldKey))
      } else {
        await db
          .insert(mediaMetadata)
          .values({ key: newKey, optimized: true, format: 'image/webp' })
      }

      await updateMediaUrlReferences(oldPublicUrl, newPublicUrl)
    } else {
      // Same key (original was already .webp) — overwrite in place, upsert metadata.
      await db
        .insert(mediaMetadata)
        .values({ key: newKey, optimized: true, format: 'image/webp' })
        .onConflictDoUpdate({
          target: mediaMetadata.key,
          set: { optimized: true, format: 'image/webp', updatedAt: sql`now()` },
        })
    }

    return Response.json({ key: newKey, publicUrl: newPublicUrl, optimized: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
