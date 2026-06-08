create table if not exists public.briefs (
  id text primary key,
  brand_id uuid not null references public.brands (id) on delete cascade,
  title text not null,
  goal text not null,
  budget_min numeric(12, 2) not null check (budget_min > 0),
  budget_max numeric(12, 2) not null check (budget_max >= budget_min),
  currency text not null check (currency in ('INR', 'AED')),
  niche text not null,
  region text not null,
  deliverables jsonb not null,
  status text not null default 'open' check (status in ('open', 'closed', 'filled')),
  created_at timestamptz not null default now()
);
create index if not exists briefs_brand_idx on public.briefs (brand_id);
create index if not exists briefs_open_match_idx on public.briefs (status, niche, region);

alter table public.briefs enable row level security;

drop policy if exists briefs_brand_all on public.briefs;
create policy briefs_brand_all on public.briefs
  for all to authenticated using (auth.uid() = brand_id) with check (auth.uid() = brand_id);

drop policy if exists briefs_read_open on public.briefs;
create policy briefs_read_open on public.briefs
  for select to authenticated using (status = 'open');
