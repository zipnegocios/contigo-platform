import { auth } from '@/infrastructure/auth/auth.config'

export const middleware = auth((req) => {
  // If no session and trying to access admin, redirect to login
  if (!req.auth && req.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }
  // Allow the request to proceed
  return undefined
})

export const config = {
  matcher: ['/admin/:path*'],
}
