import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import { mediaTags } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const tags = await db.select().from(mediaTags).orderBy(mediaTags.name)
  return Response.json(tags)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, color } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })

  const [tag] = await db
    .insert(mediaTags)
    .values({ name: name.trim(), color: color ?? '#E2C063' })
    .onConflictDoNothing()
    .returning()

  if (!tag) return Response.json({ error: 'Tag already exists' }, { status: 409 })
  return Response.json(tag, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  await db.delete(mediaTags).where(eq(mediaTags.id, id))
  return Response.json({ success: true })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name, color } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (name?.trim()) updates.name = name.trim()
  if (color) updates.color = color

  const [tag] = await db
    .update(mediaTags)
    .set(updates)
    .where(eq(mediaTags.id, id))
    .returning()

  return Response.json(tag)
}
