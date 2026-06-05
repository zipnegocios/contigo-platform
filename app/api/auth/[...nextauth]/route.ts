import { authConfig } from '@/infrastructure/auth/auth.config'
import NextAuth from 'next-auth'

const handler = NextAuth(authConfig)

export { handler as GET, handler as POST }

// Prevent static generation for this route
export const dynamic = 'force-dynamic'
