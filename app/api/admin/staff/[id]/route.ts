import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { UpdateStaffUserUseCase } from '@/application/use-cases/staff/UpdateStaffUserUseCase'
import { DeactivateStaffUserUseCase } from '@/application/use-cases/staff/DeactivateStaffUserUseCase'
import { DrizzleSecurityEventLogger } from '@/infrastructure/services/DrizzleSecurityEventLogger'
import { AdminUser } from '@/core/entities/AdminUser'

const UpdateStaffSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  title: z.string().max(100).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  isActive: z.boolean().optional(),
})

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
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'users.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = UpdateStaffSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
    }
    const { name, title, phone, isActive } = parsed.data

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
      const deactivateUseCase = new DeactivateStaffUserUseCase(repository, new DrizzleSecurityEventLogger(), userId)
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
