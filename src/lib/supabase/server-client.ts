import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // MVP: publishable key + constrained RLS insert policy. Production hardening:
  // move writes behind SUPABASE_SERVICE_ROLE_KEY (server-only) + rate limiting.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase env vars are missing')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
