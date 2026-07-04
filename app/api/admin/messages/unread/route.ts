import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.edit'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Unread client messages across all leads — for the admin-wide badge.
    const byLead = await new DrizzleLeadMessageRepository().countUnreadGroupedByLead('client')

    const total = Object.values(byLead).reduce((sum, n) => sum + n, 0)

    return Response.json({ total, byLead })
  } catch (error) {
    console.error('Error fetching admin unread message counts:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
