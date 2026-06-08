create table if not exists public.media_kits (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  handle text not null,
  display_name text not null,
  email text not null,
  niche text not null,
  region text not null,
  follower_count integer not null,
  avg_likes integer not null,
  avg_comments integer not null,
  engagement_rate numeric(6,2) not null,
  tier text not null,
  currency text not null,
  rate_card jsonb not null,
  copy jsonb not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists media_kits_niche_region_tier_idx
  on public.media_kits (niche, region, tier);
