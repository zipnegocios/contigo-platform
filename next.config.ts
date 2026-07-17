import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['postgres', 'pgvector'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.contigoconstructions.com.au',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  async headers() {
    // Scoped to /admin — no Content-Security-Policy by design (GSAP/Three.js
    // and inline styles across the admin make CSP a separate, larger effort).
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig
