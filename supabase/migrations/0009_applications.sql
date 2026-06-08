create table if not exists public.applications (
  id text primary key,
  brief_id text not null references public.briefs (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  quote_amount numeric(12, 2) not null check (quote_amount > 0),
  currency text not null check (currency in ('INR', 'AED')),
  message text not null,
  status text not null default 'applied'
    check (status in ('applied', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (brief_id, creator_id)
);
create index if not exists applications_brief_idx on public.applications (brief_id);
create index if not exists applications_creator_idx on public.applications (creator_id);

alter table public.applications enable row level security;

drop policy if exists applications_creator_all on public.applications;
create policy applications_creator_all on public.applications
  for all to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists applications_brand_read on public.applications;
create policy applications_brand_read on public.applications
  for select to authenticated
  using (exists (
    select 1 from public.briefs b
    where b.id = applications.brief_id and b.brand_id = auth.uid()
  ));
