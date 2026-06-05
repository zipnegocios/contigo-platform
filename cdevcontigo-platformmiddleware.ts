import { auth } from '@/infrastructure/auth/auth.config'

export const middleware = auth((req) => {
  // If there's no session and trying to access /admin, NextAuth redirects to /admin/login
  // (handled by auth() automatically via the pages.signIn config)
  return null
})

export const config = {
  matcher: ['/admin/:path*'],
}
