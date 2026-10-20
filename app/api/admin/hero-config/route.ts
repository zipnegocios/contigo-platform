import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleHeroConfigRepository } from '@/infrastructure/repositories/DrizzleHeroConfigRepository'
import { z } from 'zod'
import { HeroConfigInputSchema } from './heroConfigSchema'

const repo = new DrizzleHeroConfigRepository()

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const config = await repo.get()
  return Response.json({ config })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const input = HeroConfigInputSchema.parse(body)
    const config = await repo.upsert(input)
    return Response.json({ config })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
