import { auth, currentUser } from '@clerk/nextjs/server'
import { ApiError } from '@/lib/api-error'
import { logger } from '@/lib/logger'

export async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) throw new ApiError('Unauthorized', 401)
  const user = await currentUser()
  if (user?.publicMetadata?.role !== 'admin') {
    logger.warn('admin_access_forbidden', { userId })
    throw new ApiError('Forbidden', 403)
  }
  return user
}
