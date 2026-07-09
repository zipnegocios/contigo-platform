// RFC 9116 security.txt — points researchers at how to report vulnerabilities.
export const revalidate = 86400

export function GET() {
  const body = `Contact: mailto:contact@contigoconstructions.com.au
Expires: ${new Date(new Date().getFullYear() + 1, 11, 31).toISOString()}
Preferred-Languages: en
Canonical: https://contigoconstructions.com.au/.well-known/security.txt
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
