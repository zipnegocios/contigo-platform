import { z } from 'zod'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { DrizzleAuthTokenRepository } from '@/infrastructure/repositories/DrizzleAuthTokenRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { AuthTokenService } from '@/infrastructure/services/AuthTokenService'
import { DrizzleSecurityEventLogger } from '@/infrastructure/services/DrizzleSecurityEventLogger'
import { RequestPasswordResetUseCase } from '@/application/use-cases/auth/RequestPasswordResetUseCase'

const schema = z.object({
  email: z.string().email().max(255),
})

export async function POST(request: Request) {
  // Always the same shape/status regardless of whether the account exists —
  // anti-enumeration. Never branch this response on lookup results.
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ success: true })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const useCase = new RequestPasswordResetUseCase(
      new DrizzleAdminUserRepository(),
      new DrizzleAuthTokenRepository(),
      new ResendEmailService(),
      new AuthTokenService(),
      `${siteUrl}/admin/reset-password`,
      new DrizzleSecurityEventLogger(),
    )

    await useCase.execute(parsed.data.email)
  } catch (error) {
    console.error('Error processing forgot-password request:', error)
  }

  return Response.json({ success: true })
}
