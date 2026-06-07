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
}

export default nextConfig
