import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { createSSEStream } from '@/infrastructure/realtime/createSSEStream'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // Auth check completed; create SSE stream with message count data
    return createSSEStream(request, {
      fetchSnapshot: async () => {
        const byLead = await new DrizzleLeadMessageRepository().countUnreadGroupedByLead('client')
        const total = Object.values(byLead).reduce((sum, n) => sum + n, 0)
        return { total, byLead }
      },
      hasChanged: (prev, next) => !prev || JSON.stringify(prev) !== JSON.stringify(next),
      serialize: (data) => JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error in admin messages SSE stream:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500 },
    )
  }
}
