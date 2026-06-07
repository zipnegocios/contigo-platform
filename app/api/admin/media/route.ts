import { auth } from '@/infrastructure/auth/auth.config'
import { listObjects, deleteObject } from '@/infrastructure/services/R2StorageService'

const BUCKET = process.env.R2_ASSETS_BUCKET || 'contigo-assets'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') ?? undefined

    const objects = await listObjects(BUCKET, prefix)
    return Response.json(objects)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { key } = await request.json()
    if (!key || typeof key !== 'string') {
      return Response.json({ error: 'key is required' }, { status: 400 })
    }

    await deleteObject(BUCKET, key)
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
