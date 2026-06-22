import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleAdminUserLookupRepository } from '@/infrastructure/repositories/DrizzleAdminUserLookupRepository'

// Intentionally minimal: GET only. A future staff-management task
// (Task 4.1.3) will likely extend this SAME file with POST/PATCH for full
// staff CRUD + permissions — do not add anything beyond GET here.
export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const staff = await new DrizzleAdminUserLookupRepository().findAllActive()

    return Response.json({ staff })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
