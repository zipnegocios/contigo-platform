import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import { mediaFolders } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const folders = await db.select().from(mediaFolders).orderBy(mediaFolders.name)
  return Response.json(folders)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, parentId } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })

  const [folder] = await db
    .insert(mediaFolders)
    .values({ name: name.trim(), parentId: parentId ?? null })
    .returning()

  return Response.json(folder, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  await db.delete(mediaFolders).where(eq(mediaFolders.id, id))
  return Response.json({ success: true })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name } = await request.json()
  if (!id || !name?.trim()) return Response.json({ error: 'id and name are required' }, { status: 400 })

  const [folder] = await db
    .update(mediaFolders)
    .set({ name: name.trim() })
    .where(eq(mediaFolders.id, id))
    .returning()

  return Response.json(folder)
}
