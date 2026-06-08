import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import { mediaMetadata } from '@/infrastructure/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (key) {
    const [row] = await db
      .select()
      .from(mediaMetadata)
      .where(eq(mediaMetadata.key, key))
    return Response.json(row ?? null)
  }

  const rows = await db.select().from(mediaMetadata)
  return Response.json(rows)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { key, folderId, tags, notes, width, height, duration, format } = body

  if (!key) return Response.json({ error: 'key is required' }, { status: 400 })

  const [row] = await db
    .insert(mediaMetadata)
    .values({
      key,
      folderId: folderId ?? null,
      tags: tags ?? [],
      notes: notes ?? null,
      width: width ?? null,
      height: height ?? null,
      duration: duration ?? null,
      format: format ?? null,
    })
    .onConflictDoUpdate({
      target: mediaMetadata.key,
      set: {
        folderId: sql`excluded.folder_id`,
        tags: sql`excluded.tags`,
        notes: sql`excluded.notes`,
        width: sql`excluded.width`,
        height: sql`excluded.height`,
        duration: sql`excluded.duration`,
        format: sql`excluded.format`,
        updatedAt: sql`now()`,
      },
    })
    .returning()

  return Response.json(row)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { key, ...updates } = body

  if (!key) return Response.json({ error: 'key is required' }, { status: 400 })

  const allowed = ['folderId', 'tags', 'notes', 'width', 'height', 'duration', 'format'] as const
  const patch: Record<string, unknown> = { updatedAt: new Date() }
  for (const field of allowed) {
    if (field in updates) patch[field] = updates[field]
  }

  // Upsert - create if not exists
  const [existing] = await db
    .select({ id: mediaMetadata.id })
    .from(mediaMetadata)
    .where(eq(mediaMetadata.key, key))

  let row
  if (existing) {
    ;[row] = await db
      .update(mediaMetadata)
      .set(patch)
      .where(eq(mediaMetadata.key, key))
      .returning()
  } else {
    ;[row] = await db
      .insert(mediaMetadata)
      .values({ key, folderId: null, tags: [], ...patch })
      .returning()
  }

  return Response.json(row)
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await request.json()
  if (!key) return Response.json({ error: 'key is required' }, { status: 400 })

  await db.delete(mediaMetadata).where(eq(mediaMetadata.key, key))
  return Response.json({ success: true })
}
