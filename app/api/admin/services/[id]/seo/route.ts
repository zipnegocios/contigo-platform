import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import { services } from '@/infrastructure/db/schema'
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
  const { metaTitle, metaDescription, metaKeywords, noIndex } = body

  try {
    await db
      .update(services)
      .set({
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
        noIndex: noIndex || false,
      })
      .where(eq(services.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update service SEO:', error)
    return NextResponse.json({ error: 'Failed to update SEO metadata' }, { status: 500 })
  }
}
