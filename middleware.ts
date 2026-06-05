export { auth as middleware } from '@/infrastructure/auth/auth.config'

export const config = {
  matcher: ['/admin/:path*'],
}
