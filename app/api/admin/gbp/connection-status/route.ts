import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { GoogleBusinessProfileService } from '@/infrastructure/services/GoogleBusinessProfileService'
import { GetGbpConnectionStatusUseCase } from '@/application/use-cases/reviews/GetGbpConnectionStatusUseCase'

const querySchema = z.object({
  refresh: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Owner-only (plan §8 Q3 default) — this surfaces raw-ish Google error
    // detail strings, treated the same as other sensitive settings.
    const role = (session.user as { role?: string })?.role
    if (role !== 'owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({ refresh: searchParams.get('refresh') ?? undefined })
    const forceRefresh = parsed.success && parsed.data.refresh === '1'

    const useCase = new GetGbpConnectionStatusUseCase(new GoogleBusinessProfileService())
    const state = await useCase.execute(forceRefresh)

    return Response.json(state)
  } catch (error) {
    console.error('Error checking GBP connection status:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
