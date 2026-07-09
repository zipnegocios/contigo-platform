import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'

// First-party click-tracking redirect (plan Phase 5 fallback — Resend
// webhook open/click tracking was judged heavier than needed for v1). The
// CTA in every review-request email points here instead of straight to
// Google, so a click updates `clickedAt` before handing off.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const placeId = process.env.GOOGLE_PLACE_ID
  const fallbackUrl = 'https://www.google.com/business/'
  const googleUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : fallbackUrl

  try {
    const { id } = await params
    const repository = new DrizzleReviewRequestRepository()
    const request = await repository.findById(id)

    if (request && !request.clickedAt) {
      await repository.update(request.markClicked())
    }
  } catch (error) {
    console.error('Error recording review request click:', error)
    // Never block the redirect on a tracking failure.
  }

  return Response.redirect(googleUrl, 302)
}
