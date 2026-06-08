create table if not exists public.brands (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  website text,
  created_at timestamptz not null default now()
);
alter table public.brands enable row level security;
drop policy if exists brands_select_own on public.brands;
create policy brands_select_own on public.brands
  for select to authenticated using (auth.uid() = id);
drop policy if exists brands_insert_own on public.brands;
create policy brands_insert_own on public.brands
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists brands_update_own on public.brands;
create policy brands_update_own on public.brands
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
