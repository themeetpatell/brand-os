-- Capture media_kits Row Level Security + grants into source control, and stop
-- exposing creator email through the public (anon / publishable-key) read path.
--
-- Context: writes go through the Supabase publishable key (see
-- src/lib/supabase/server-client.ts), so the anon/authenticated roles must be
-- able to insert constrained rows and read only published kits. Until now those
-- policies lived only in the live database — this migration makes a fresh
-- provision reproduce the same state.

-- 1. Row Level Security (mirrors live state).
alter table public.media_kits enable row level security;

drop policy if exists public_read_published_kits on public.media_kits;
create policy public_read_published_kits
  on public.media_kits
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists public_insert_valid_kits on public.media_kits;
create policy public_insert_valid_kits
  on public.media_kits
  for insert
  to anon, authenticated
  with check (
    niche = any (array['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'])
    and region = any (array['IN', 'AE'])
    and tier = any (array['nano', 'micro', 'mid', 'macro'])
    and currency = any (array['INR', 'AED'])
    and follower_count > 0
    and avg_likes >= 0
    and avg_comments >= 0
    and engagement_rate >= 0
    and engagement_rate <= 100
    and published = true
  );

-- 2. PII hardening: email must never be selectable by the public roles.
--    Replace the broad table-level SELECT with a column-level grant that
--    excludes `email`. Insert privileges are untouched, so kits still capture
--    the creator's email; it is simply unreadable via the publishable key.
revoke select on public.media_kits from anon, authenticated;
grant select (
  id, slug, handle, display_name, niche, region,
  follower_count, avg_likes, avg_comments, engagement_rate,
  tier, currency, rate_card, copy, published, created_at
) on public.media_kits to anon, authenticated;

-- 3. Defense in depth: the public roles have no UPDATE policy, so the latent
--    default UPDATE grant is unreachable surface — drop it.
revoke update on public.media_kits from anon, authenticated;
