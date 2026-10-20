import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleHeroConfigRepository } from '@/infrastructure/repositories/DrizzleHeroConfigRepository'
import { DrizzleHeroConfigVersionRepository } from '@/infrastructure/repositories/DrizzleHeroConfigVersionRepository'

const configRepo = new DrizzleHeroConfigRepository()
const versionRepo = new DrizzleHeroConfigVersionRepository()

// Publishes a stored version. The config being replaced is snapshotted first so nothing is lost.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const version = await versionRepo.findById(id)
    if (!version) return Response.json({ error: 'Version not found' }, { status: 404 })

    const current = await configRepo.get()
    if (current) {
      const { id: _id, updatedAt: _updatedAt, ...snapshot } = current
      await versionRepo.create(`Before restoring "${version.label}"`.slice(0, 120), snapshot, version.id)
    }

    const config = await configRepo.upsert(version.snapshot)
    return Response.json({ config, versions: await versionRepo.list() })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
