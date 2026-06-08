-- Denormalized onto creators so the matched-briefs query is a clean filter.
alter table public.creators add column if not exists niche text;
alter table public.creators add column if not exists region text;
