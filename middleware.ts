import { auth } from '@/infrastructure/auth/auth.config'

export const middleware = auth((req) => {
  // Allow unauthenticated access to login page
  if (req.nextUrl.pathname === '/admin/login') {
    return undefined
  }

  // Protect other admin routes - redirect to login if not authenticated
  if (req.nextUrl.pathname.startsWith('/admin') && !req.auth) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }

  return undefined
})

export const config = {
  matcher: ['/admin/:path*'],
}
