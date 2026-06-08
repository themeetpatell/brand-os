import { createServerClient } from '../supabase/server-client'

// Resolve the authenticated creator from a Supabase access token sent as a
// Bearer header. Returns null when absent/invalid — callers return 401.
export async function getCreatorIdFromRequest(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) return null

  const { data, error } = await createServerClient().auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}
