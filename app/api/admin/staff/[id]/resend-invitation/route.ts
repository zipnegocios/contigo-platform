import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { DrizzleAuthTokenRepository } from '@/infrastructure/repositories/DrizzleAuthTokenRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { AuthTokenService } from '@/infrastructure/services/AuthTokenService'
import { DrizzleSecurityEventLogger } from '@/infrastructure/services/DrizzleSecurityEventLogger'
import { CreateStaffUserUseCase } from '@/application/use-cases/staff/CreateStaffUserUseCase'

export async function POST(
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
    const repository = new DrizzleAdminUserRepository()
    const user = await repository.findById(id)
    if (!user) return Response.json({ error: 'Staff user not found' }, { status: 404 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const useCase = new CreateStaffUserUseCase(
      repository,
      new DrizzleAuthTokenRepository(),
      new ResendEmailService(),
      new AuthTokenService(),
      `${siteUrl}/admin/accept-invitation`,
      new DrizzleSecurityEventLogger(),
      userId,
    )
    await useCase.sendInvitation(user)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error resending invitation:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
