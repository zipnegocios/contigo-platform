import { auth } from '@/infrastructure/auth/auth.config'

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/accept-invitation',
])

export const middleware = auth((req) => {
  // Allow unauthenticated access to public admin auth pages
  if (PUBLIC_ADMIN_PATHS.has(req.nextUrl.pathname)) {
    return undefined
  }

  // API routes get a JSON 401 instead of a redirect — this is defense in
  // depth, the in-handler `auth()`/`hasPermission()` checks in each route
  // stay in place and remain the source of truth for permissions.
  if (req.nextUrl.pathname.startsWith('/api/admin') && !req.auth?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Protect other admin routes - redirect to login if not authenticated
  // (checks `.user`, not just session truthiness — an invalidated session,
  // e.g. after a password reset or deactivation, still resolves to a
  // session object but with `user` cleared, see auth.config.ts).
  if (req.nextUrl.pathname.startsWith('/admin') && !req.auth?.user) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }

  return undefined
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
