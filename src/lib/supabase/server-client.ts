import { createClient } from '@supabase/supabase-js'

// Publishable/anon-key client. Reads run under RLS (public read of published kits);
// inserts use the constrained RLS policy from 0002. Used by the media-kit flow.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase env vars are missing')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

// Service-role client (bypasses RLS). REQUIRED for privileged server operations
// where ownership is enforced in application code (deal ledger, payouts, webhooks).
// Fails loudly rather than silently degrading to the anon key, which would let RLS
// silently block writes and mask the misconfiguration.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
