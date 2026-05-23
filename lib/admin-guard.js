import { createClient } from '@/lib/supabase/server'
import { ApiError } from '@/lib/api-error'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') throw new ApiError('Forbidden', 403)
  return user
}
