import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'

// Reduced staff listing for non-management consumers (e.g. task assignee
// dropdowns) — any authenticated session, not gated by `users.manage`.
// Returns only what's needed to label a person, never phone/lastLogin/role.
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const staff = await new DrizzleAdminUserRepository().findAll()
    const options = staff
      .filter((user) => user.isActive)
      .map((user) => ({ id: user.id, name: user.name, email: user.email }))

    return Response.json({ staff: options })
  } catch (error) {
    console.error('Error fetching staff options:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
