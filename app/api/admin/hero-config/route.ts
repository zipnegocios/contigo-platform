import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleHeroConfigRepository } from '@/infrastructure/repositories/DrizzleHeroConfigRepository'
import { z } from 'zod'

const ButtonSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  style: z.enum(['primary', 'secondary']),
  linkType: z.enum(['custom', 'service', 'project', 'scroll', 'form']),
  href: z.string(),
  scrollTarget: z.string().optional(),
  entityId: z.string().optional(),
  entityLabel: z.string().optional(),
  formId: z.string().optional(),
  formSlug: z.string().optional(),
  formName: z.string().optional(),
})

const SlideSchema = z.object({
  id: z.string(),
  desktopImageUrl: z.string(),
  mobileImageUrl: z.string().optional(),
  headline: z.string(),
  subtitle: z.string().optional(),
  eyebrow: z.string().optional(),
  buttons: z.array(ButtonSchema),
})

const InputSchema = z.object({
  mode: z.enum(['single', 'slider']),
  headline: z.string(),
  subtitle: z.string().optional(),
  eyebrow: z.string().optional(),
  desktopImageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  buttons: z.array(ButtonSchema),
  slides: z.array(SlideSchema),
  autoplayInterval: z.number().int().min(1000).max(30000),
  overlayOpacity: z.number().int().min(0).max(100),
})

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
    const input = InputSchema.parse(body)
    const config = await repo.upsert(input)
    return Response.json({ config })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
