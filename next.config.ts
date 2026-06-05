import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['postgres', 'pgvector'],
  images: {
    domains: [
      'cdn.example.com', // R2 public URL will be set here in production
    ],
  },
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
}

export default nextConfig
