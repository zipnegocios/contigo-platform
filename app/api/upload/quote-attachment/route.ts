import { z } from 'zod'
import { generatePresignedPutUrl, buildKey } from '@/infrastructure/services/R2StorageService'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const

const AttachmentPresignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_TYPES),
})

// TODO: Add rate limiting (e.g. Upstash Redis) before production traffic.
// Without it, any visitor can trigger presigned URL generation against R2.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filename, contentType } = AttachmentPresignSchema.parse(body)

    const bucket = process.env.R2_QUOTES_BUCKET
    if (!bucket) {
      return Response.json({ error: 'R2_QUOTES_BUCKET not configured' }, { status: 500 })
    }

    const key = buildKey('attachments', filename)
    const presignedUrl = await generatePresignedPutUrl(bucket, key, contentType)

    // No publicUrl — contigo-quotes is a private bucket
    return Response.json({ presignedUrl, key })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Quote attachment presign error:', error)
    return Response.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
