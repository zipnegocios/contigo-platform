import { NextResponse } from 'next/server'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export async function GET() {
  try {
    const repo = new DrizzleProjectRepository()
    const projects = await repo.findFeatured()

    const data = projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      location: p.location,
      coverImageUrl: p.coverImageUrl,
    }))

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
