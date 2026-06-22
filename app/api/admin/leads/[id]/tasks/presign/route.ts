import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { generatePresignedPutUrl, buildKey } from '@/infrastructure/services/R2StorageService'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

const TaskAttachmentPresignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_TYPES),
})

// Step 1 of 2 for new (non-Media-Library) task attachment uploads:
// returns a presigned PUT URL against the same private `contigo-quotes`
// bucket used by quote attachments. The client PUTs the file directly to
// R2 using this URL, then calls POST .../tasks/[taskId]/attachments with
// { key, filename } to persist the attachment record (step 2).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await params

    const body = await request.json()
    const { filename, contentType } = TaskAttachmentPresignSchema.parse(body)

    const bucket = process.env.R2_QUOTES_BUCKET
    if (!bucket) {
      return Response.json({ error: 'R2_QUOTES_BUCKET not configured' }, { status: 500 })
    }

    const key = buildKey('task-attachments', filename)
    const presignedUrl = await generatePresignedPutUrl(bucket, key, contentType)

    // No publicUrl — contigo-quotes is a private bucket
    return Response.json({ presignedUrl, key })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Task attachment presign error:', error)
    return Response.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
