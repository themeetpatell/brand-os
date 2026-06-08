-- Creators own their media kit and deal ledger once authenticated (Supabase Auth).
-- Additive to the Phase 0 anon-publishable model: existing kits predate auth and
-- keep working; new ownership is layered on via auth.uid().

create table if not exists public.creators (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  display_name text not null,
  email text not null,
  rate_floor numeric(12, 2),
  created_at timestamptz not null default now()
);

alter table public.creators enable row level security;

drop policy if exists creators_select_own on public.creators;
create policy creators_select_own on public.creators
  for select to authenticated using (auth.uid() = id);

drop policy if exists creators_insert_own on public.creators;
create policy creators_insert_own on public.creators
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists creators_update_own on public.creators;
create policy creators_update_own on public.creators
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Link media kits to an owner (nullable; Phase 0 kits have no owner).
alter table public.media_kits
  add column if not exists creator_id uuid references public.creators (id) on delete set null;

-- Authenticated owners can update their own kits (additive to 0002's public read).
drop policy if exists media_kits_owner_update on public.media_kits;
create policy media_kits_owner_update on public.media_kits
  for update to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);
