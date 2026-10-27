import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleGoogleReviewPhotoRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewPhotoRepository'

const PatchSchema = z
  .object({ isHidden: z.boolean().optional(), reviewId: z.string().uuid().nullable().optional() })
  .refine((v) => v.isHidden !== undefined || v.reviewId !== undefined, { message: 'Nothing to update' })

// Hide/show a customer photo, or reassign it to another review (marks it manual so sync keeps it).
export async function PATCH(request: Request, { params }: { params: Promise<{ photoId: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.moderate'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { photoId } = await params
    const patch = PatchSchema.parse(await request.json())
    const photo = await new DrizzleGoogleReviewPhotoRepository().update(photoId, patch)
    if (!photo) return Response.json({ error: 'Photo not found' }, { status: 404 })
    return Response.json({ photo })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error updating review photo:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
