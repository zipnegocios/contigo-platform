import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import { categories } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { metaTitle, metaDescription, metaKeywords } = body

  try {
    await db
      .update(categories)
      .set({
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
      })
      .where(eq(categories.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update category SEO:', error)
    return NextResponse.json({ error: 'Failed to update SEO metadata' }, { status: 500 })
  }
}
