-- Enforce the niche/region domain at the DB layer (parity with the currency/status
-- checks on briefs). NULL passes for the nullable creator columns. Idempotent.

alter table public.creators drop constraint if exists creators_niche_check;
alter table public.creators add constraint creators_niche_check
  check (niche in ('fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'));

alter table public.creators drop constraint if exists creators_region_check;
alter table public.creators add constraint creators_region_check
  check (region in ('IN', 'AE'));

alter table public.briefs drop constraint if exists briefs_niche_check;
alter table public.briefs add constraint briefs_niche_check
  check (niche in ('fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'));

alter table public.briefs drop constraint if exists briefs_region_check;
alter table public.briefs add constraint briefs_region_check
  check (region in ('IN', 'AE'));
