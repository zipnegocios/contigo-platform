import { NextResponse } from 'next/server'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleReviewTagRepository } from '@/infrastructure/repositories/DrizzleReviewTagRepository'
import { GetPublicReviewsUseCase } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'

// Static-cacheable: admin moderation changes don't need to appear instantly,
// so a short revalidate window keeps this off the Cloudflare rate-limit
// budget entirely (plan Phase 4).
export const revalidate = 300

export async function GET() {
  try {
    const useCase = new GetPublicReviewsUseCase(
      new DrizzleGoogleReviewRepository(),
      new DrizzleReviewSettingsRepository(),
      new DrizzleReviewTagRepository(),
    )
    const result = await useCase.execute()

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error fetching public reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
