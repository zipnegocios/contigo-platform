export function getClientIp(request: Request): string | null {
  const cfIp = request.headers.get('CF-Connecting-IP')
  if (cfIp) return cfIp

  const forwardedFor = request.headers.get('X-Forwarded-For')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  return null
}
