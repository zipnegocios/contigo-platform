import { z } from 'zod'
import { and, desc, eq, lt } from 'drizzle-orm'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { db } from '@/infrastructure/db/client'
import { securityEvents, adminUsers } from '@/infrastructure/db/schema'

const PAGE_SIZE = 50

const querySchema = z.object({
  cursor: z.string().datetime().optional(),
  eventType: z.string().max(100).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'settings.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      cursor: searchParams.get('cursor') ?? undefined,
      eventType: searchParams.get('eventType') ?? undefined,
    })
    if (!parsed.success) {
      return Response.json({ error: 'Invalid query' }, { status: 400 })
    }

    const conditions = []
    if (parsed.data.cursor) {
      conditions.push(lt(securityEvents.createdAt, new Date(parsed.data.cursor)))
    }
    if (parsed.data.eventType) {
      conditions.push(eq(securityEvents.eventType, parsed.data.eventType))
    }

    const rows = await db
      .select({
        id: securityEvents.id,
        eventType: securityEvents.eventType,
        payload: securityEvents.payload,
        createdAt: securityEvents.createdAt,
        actorId: securityEvents.actorId,
        actorName: adminUsers.name,
        actorEmail: adminUsers.email,
      })
      .from(securityEvents)
      .leftJoin(adminUsers, eq(securityEvents.actorId, adminUsers.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(securityEvents.createdAt))
      .limit(PAGE_SIZE + 1)

    const hasMore = rows.length > PAGE_SIZE
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null

    return Response.json({ events: page, nextCursor })
  } catch (error) {
    console.error('Error fetching security events:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
