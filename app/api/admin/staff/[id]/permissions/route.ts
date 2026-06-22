import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzlePermissionRepository } from '@/infrastructure/repositories/DrizzlePermissionRepository'
import { SetStaffPermissionsUseCase } from '@/application/use-cases/staff/SetStaffPermissionsUseCase'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'users.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { permissionKeys } = body

    if (!Array.isArray(permissionKeys) || !permissionKeys.every((key) => typeof key === 'string')) {
      return Response.json({ error: 'permissionKeys must be an array of strings' }, { status: 400 })
    }

    const useCase = new SetStaffPermissionsUseCase(new DrizzlePermissionRepository())
    await useCase.execute(id, permissionKeys)

    return Response.json({ success: true, permissionKeys })
  } catch (error) {
    console.error('Error setting staff permissions:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
