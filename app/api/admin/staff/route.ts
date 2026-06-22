import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { CreateStaffUserUseCase } from '@/application/use-cases/staff/CreateStaffUserUseCase'
import { AdminUser } from '@/core/entities/AdminUser'

function serializeStaffUser(user: AdminUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    phone: user.phone,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

// Lists ALL staff (active and inactive) for the staff management table.
export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const staff = await new DrizzleAdminUserRepository().findAll()

    return Response.json({ staff: staff.map(serializeStaffUser) })
  } catch (error) {
    console.error('Error fetching staff:', error)
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

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'users.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, title, phone } = body

    if (!name || !email || !password) {
      return Response.json({ error: 'name, email and password are required' }, { status: 400 })
    }

    const repository = new DrizzleAdminUserRepository()

    const existing = await repository.findByEmail(email)
    if (existing) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const useCase = new CreateStaffUserUseCase(repository)
    const user = await useCase.execute({ name, email, password, title, phone })

    return Response.json({ success: true, staff: serializeStaffUser(user) }, { status: 201 })
  } catch (error) {
    console.error('Error creating staff user:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
