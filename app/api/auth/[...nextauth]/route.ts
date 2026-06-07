import { handlers } from '@/infrastructure/auth/auth.config'

export const { GET, POST } = handlers

// Prevent static generation for this route
export const dynamic = 'force-dynamic'
