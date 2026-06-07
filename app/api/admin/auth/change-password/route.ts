import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import * as schema from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'
import { compare, hash } from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: 'Current password and new password are required' },
        { status: 400 },
      )
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 },
      )
    }

    // Get current user
    const users = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, session.user.email))
      .limit(1)

    const user = users[0]

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password
    const newHash = await hash(newPassword, 10)

    // Update password
    await db
      .update(schema.adminUsers)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, user.id))

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
