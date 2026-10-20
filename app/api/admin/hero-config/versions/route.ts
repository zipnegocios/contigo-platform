import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleHeroConfigVersionRepository } from '@/infrastructure/repositories/DrizzleHeroConfigVersionRepository'
import { HeroConfigInputSchema } from '../heroConfigSchema'

const repo = new DrizzleHeroConfigVersionRepository()

const CreateSchema = z.object({
  label: z.string().trim().max(120).optional(),
  config: HeroConfigInputSchema,
})

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const versions = await repo.list()
  return Response.json({ versions })
}

// Snapshots the config sent by the editor (including unsaved edits) as a new version.
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { label, config } = CreateSchema.parse(await request.json())
    const fallbackLabel = `Version ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`
    await repo.create(label || fallbackLabel, config)
    const versions = await repo.list()
    return Response.json({ versions })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
