import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadContactRoleRepository } from '@/infrastructure/repositories/DrizzleLeadContactRoleRepository'
import { toLeadContactRoleDTO } from '@/presentation/types/LeadContactRoleDTO'

function keyFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await new DrizzleLeadContactRoleRepository().findAll()
    return Response.json({ roles: roles.map(toLeadContactRoleDTO) })
  } catch (error) {
    console.error('Error fetching lead contact roles:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { label } = body

    if (!label || typeof label !== 'string' || !label.trim()) {
      return Response.json({ error: 'label is required' }, { status: 400 })
    }

    const trimmedLabel = label.trim()
    const key = keyFromLabel(trimmedLabel)
    if (!key) {
      return Response.json({ error: 'label must contain at least one letter or number' }, { status: 400 })
    }

    const repo = new DrizzleLeadContactRoleRepository()

    const existing = await repo.findByKey(key)
    if (existing) {
      return Response.json({ success: true, role: toLeadContactRoleDTO(existing) }, { status: 200 })
    }

    const role = await repo.create({ key, label: trimmedLabel })
    return Response.json({ success: true, role: toLeadContactRoleDTO(role) }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead contact role:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
