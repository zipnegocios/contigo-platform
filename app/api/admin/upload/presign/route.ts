import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { generatePresignedPutUrl, buildKey } from '@/infrastructure/services/R2StorageService'

const ALLOWED_PREFIXES = ['projects/cover', 'projects/gallery', 'projects/video', 'services', 'services/gallery'] as const
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg',
] as const

const PresignSchema = z.object({
  prefix: z.enum(ALLOWED_PREFIXES),
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_TYPES),
  folder: z.string().regex(/^[a-z0-9-]{1,100}$/).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { prefix, filename, contentType, folder } = PresignSchema.parse(body)

    const bucket = process.env.R2_ASSETS_BUCKET
    if (!bucket) {
      return Response.json({ error: 'R2_ASSETS_BUCKET not configured' }, { status: 500 })
    }

    const effectivePrefix = folder ? `${prefix}/${folder}` : prefix
    const key = buildKey(effectivePrefix, filename)
    const presignedUrl = await generatePresignedPutUrl(bucket, key, contentType)

    const assetsBaseUrl = process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'
    const publicUrl = `${assetsBaseUrl}/${key}`

    return Response.json({ presignedUrl, key, publicUrl })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Admin presign error:', error)
    return Response.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
