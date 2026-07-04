import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { createSSEStream } from '@/infrastructure/realtime/createSSEStream'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    const { id } = await params

    // Auth check completed; create SSE stream with the lead's full message
    // thread. This is a live-update feed for a thread that's already open —
    // it must NOT mark messages as read; only the explicit REST GET does
    // that when staff opens the thread.
    return createSSEStream(request, {
      fetchSnapshot: async () => new DrizzleLeadMessageRepository().findByLeadId(id),
      // findByLeadId orders newest-first (desc createdAt), so index 0 is the
      // newest message.
      hasChanged: (prev, next) => !prev || prev.length !== next.length || prev[0]?.id !== next[0]?.id,
      serialize: (data) => JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error in lead messages SSE stream:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500 },
    )
  }
}
