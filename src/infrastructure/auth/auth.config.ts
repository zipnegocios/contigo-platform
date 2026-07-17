import { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth from 'next-auth'
import { db } from '../db/client'
import { adminUsers } from '../db/schema'
import { eq } from 'drizzle-orm'
import { DrizzleAdminUserRepository } from '../repositories/DrizzleAdminUserRepository'
import { VerifyCredentialsUseCase } from '@/application/use-cases/auth/VerifyCredentialsUseCase'
import { DrizzleSecurityEventLogger } from '../services/DrizzleSecurityEventLogger'
import { getClientIp } from './getClientIp'

export const authConfig: NextAuthConfig = {
  basePath: '/api/auth',
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          const useCase = new VerifyCredentialsUseCase(new DrizzleAdminUserRepository(), new DrizzleSecurityEventLogger())
          const adminUser = await useCase.execute(credentials.email as string, credentials.password as string, {
            ipAddress: getClientIp(request),
            userAgent: request.headers.get('user-agent'),
          })

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            sessionVersion: adminUser.sessionVersion,
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Authentication failed')
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 hours
  },
  jwt: {
    maxAge: 12 * 60 * 60, // 12 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as typeof user & { role?: string; sessionVersion?: number }
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = typedUser.role
        token.sessionVersion = typedUser.sessionVersion
        return token
      }

      // Re-validated on every request (not just sign-in) so a password
      // reset or account deactivation kills the session immediately instead
      // of waiting out the JWT's maxAge.
      //
      // Skipped when this callback runs inside `middleware.ts`, which Next.js
      // executes on the Edge runtime by default — the `postgres` driver needs
      // raw TCP sockets, unavailable there. Middleware falls back to its
      // pre-existing "does a JWT exist at all" check; the authoritative
      // per-session revalidation still runs on every request that reaches
      // the protected layout or an API route handler, both Node.js runtime.
      if (process.env.NEXT_RUNTIME !== 'nodejs') {
        return token
      }

      const rows = await db
        .select({ isActive: adminUsers.isActive, sessionVersion: adminUsers.sessionVersion })
        .from(adminUsers)
        .where(eq(adminUsers.id, token.id as string))
        .limit(1)

      const current = rows[0]
      if (!current || !current.isActive || current.sessionVersion !== token.sessionVersion) {
        token.invalid = true
      }

      return token
    },
    async session({ session, token }) {
      if (token.invalid) {
        // `Session.user` is optional — clearing it is how we signal "no
        // longer authenticated" to callers (middleware/layout check
        // `session?.user`, not just session truthiness).
        session.user = undefined
        return session
      }
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        ;(session.user as typeof session.user & { role?: string }).role = token.role as string
      }
      return session
    },
  },
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
