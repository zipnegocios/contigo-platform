import { z } from 'zod'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { DrizzleAuthTokenRepository } from '@/infrastructure/repositories/DrizzleAuthTokenRepository'
import { AuthTokenService } from '@/infrastructure/services/AuthTokenService'
import { DrizzleSecurityEventLogger } from '@/infrastructure/services/DrizzleSecurityEventLogger'
import { ResetPasswordUseCase } from '@/application/use-cases/auth/ResetPasswordUseCase'

const schema = z.object({
  token: z.string().min(1).max(128),
  password: z.string().min(1).max(128),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const useCase = new ResetPasswordUseCase(
      new DrizzleAdminUserRepository(),
      new DrizzleAuthTokenRepository(),
      new AuthTokenService(),
      new DrizzleSecurityEventLogger(),
    )

    await useCase.execute(parsed.data.token, parsed.data.password)

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 400 },
    )
  }
}
