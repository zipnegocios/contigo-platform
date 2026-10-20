import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleHeroConfigVersionRepository } from '@/infrastructure/repositories/DrizzleHeroConfigVersionRepository'
import { HeroConfigInputSchema } from '../heroConfigSchema'
import { isSameHeroConfig } from '@/core/lib/heroConfigFingerprint'

const repo = new DrizzleHeroConfigVersionRepository()

const CreateSchema = z.object({
  tag: z.string().trim().max(60).optional(),
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
    const { tag, config } = CreateSchema.parse(await request.json())
    // Nothing to version if an identical configuration (recent or archived) is already stored.
    const duplicate = (await repo.list()).find((v) => isSameHeroConfig(v.snapshot, config))
    if (duplicate) {
      const name = duplicate.tag ? `${duplicate.label} (${duplicate.tag})` : duplicate.label
      return Response.json(
        { error: `No changes to version — identical to the version from ${name}.`, duplicateId: duplicate.id },
        { status: 409 },
      )
    }
    // The name is always the creation date/time; the tag is the admin's optional reminder.
    const label = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })
    await repo.create(label, config, { tag })
    const versions = await repo.list()
    return Response.json({ versions })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
