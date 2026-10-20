import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleHeroConfigVersionRepository } from '@/infrastructure/repositories/DrizzleHeroConfigVersionRepository'

const repo = new DrizzleHeroConfigVersionRepository()

const PatchSchema = z
  .object({ archived: z.boolean().optional(), tag: z.string().trim().max(60).nullable().optional() })
  .refine((v) => v.archived !== undefined || v.tag !== undefined, { message: 'Nothing to update' })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const patch = PatchSchema.parse(await request.json())
    const updated = await repo.update(id, patch)
    if (!updated) return Response.json({ error: 'Version not found' }, { status: 404 })
    return Response.json({ versions: await repo.list() })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    await repo.delete(id)
    return Response.json({ versions: await repo.list() })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
