import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import { mediaMetadata } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'
import { renameObjectKey } from '@/infrastructure/services/R2StorageService'
import { updateMediaUrlReferences } from '@/infrastructure/services/MediaReferenceService'

const BUCKET = process.env.R2_ASSETS_BUCKET || 'contigo-assets'
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'

function sanitiseBasename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { key: oldKey, newName } = await request.json()
    if (!oldKey || typeof oldKey !== 'string' || !newName || typeof newName !== 'string') {
      return Response.json({ error: 'key and newName are required' }, { status: 400 })
    }

    const lastSlash = oldKey.lastIndexOf('/')
    const dir = lastSlash >= 0 ? oldKey.slice(0, lastSlash + 1) : ''
    const oldBasename = lastSlash >= 0 ? oldKey.slice(lastSlash + 1) : oldKey

    const lastDot = oldBasename.lastIndexOf('.')
    const ext = lastDot > 0 ? oldBasename.slice(lastDot + 1).toLowerCase() : ''

    // Strip any extension the user typed in newName, then re-append the ORIGINAL extension.
    const newNameDotIdx = newName.lastIndexOf('.')
    const rawNewBase = newNameDotIdx > 0 ? newName.slice(0, newNameDotIdx) : newName
    const sanitisedBase = sanitiseBasename(rawNewBase)

    if (!sanitisedBase) {
      return Response.json({ error: 'newName resolves to an empty filename' }, { status: 400 })
    }

    const newBasename = ext ? `${sanitisedBase}.${ext}` : sanitisedBase
    const newKey = `${dir}${newBasename}`

    if (newKey === oldKey) {
      return Response.json({ key: oldKey, publicUrl: `${ASSETS_URL}/${oldKey}` })
    }

    const newPublicUrl = await renameObjectKey(BUCKET, oldKey, newKey)
    const oldPublicUrl = `${ASSETS_URL}/${oldKey}`

    // Migrate metadata row if one exists (key is unique; not every object has a row).
    const [existingMeta] = await db
      .select({ id: mediaMetadata.id })
      .from(mediaMetadata)
      .where(eq(mediaMetadata.key, oldKey))

    if (existingMeta) {
      await db
        .update(mediaMetadata)
        .set({ key: newKey, updatedAt: new Date() })
        .where(eq(mediaMetadata.key, oldKey))
    }

    await updateMediaUrlReferences(oldPublicUrl, newPublicUrl)

    return Response.json({ key: newKey, publicUrl: newPublicUrl })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
