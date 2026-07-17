import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { DrizzlePermissionRepository } from '@/infrastructure/repositories/DrizzlePermissionRepository'
import { StaffManagerClient } from '@/presentation/components/admin/StaffManagerClient'

export default async function StaffManagementPage() {
  const adminUserRepository = new DrizzleAdminUserRepository()
  const permissionRepository = new DrizzlePermissionRepository()

  const staff = await adminUserRepository.findAll()
  const staffWithPermissions = await Promise.all(
    staff.map(async (user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      phone: user.phone,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      permissionKeys: await permissionRepository.findAllForUser(user.id),
    })),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Leads Management
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Manage staff accounts and their granular permissions
        </p>
      </div>

      <StaffManagerClient initialStaff={staffWithPermissions} />
    </div>
  )
}
