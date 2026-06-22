import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { UpdateStaffUserUseCase } from '@/application/use-cases/staff/UpdateStaffUserUseCase'
import { DeactivateStaffUserUseCase } from '@/application/use-cases/staff/DeactivateStaffUserUseCase'
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, title, phone, isActive } = body

    const hasProfileFields = name !== undefined || title !== undefined || phone !== undefined

    if (!hasProfileFields && isActive === undefined) {
      return Response.json(
        { error: 'At least one field (name, title, phone, isActive) is required' },
        { status: 400 },
      )
    }

    const repository = new DrizzleAdminUserRepository()
    let user: AdminUser | undefined

    if (hasProfileFields) {
      const updateUseCase = new UpdateStaffUserUseCase(repository)
      user = await updateUseCase.execute(id, { name, title, phone })
    }

    if (isActive !== undefined) {
      const deactivateUseCase = new DeactivateStaffUserUseCase(repository)
      user = await deactivateUseCase.execute(id, isActive)
    }

    return Response.json({ success: true, staff: serializeStaffUser(user as AdminUser) })
  } catch (error) {
    console.error('Error updating staff user:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
