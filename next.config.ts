import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['postgres', 'pgvector'],
  images: {
    // Disabled to avoid EACCES on /app/.next/cache/images in Docker containers.
    // All production images are served via R2 CDN (no optimization needed server-side).
    unoptimized: true,
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
}

export default nextConfig
