# Roster — AI Media-Kit & Rate-Card Tool

A free web app where a creator enters their Instagram stats and instantly gets a
shareable, AI-generated media kit with a data-backed rate card. Built on Next.js
16 (App Router) + Supabase, deployed on Vercel.

- **Pricing engine** — pure, fully-tested functions compute engagement rate,
  follower tier, and per-deliverable rate bands (`src/lib/pricing/`).
- **AI copy** — media-kit prose via the Vercel AI Gateway, with a deterministic
  fallback if the model call fails (`src/lib/ai/media-kit-copy.ts`).
- **Persistence** — a single `media_kits` table guarded by RLS
  (`supabase/migrations/`).
- **Public kit** — shareable page at `/kit/[slug]`.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the values (see below)
pnpm dev                     # http://localhost:3000
```

## Environment variables

See [`.env.example`](.env.example) for the full list. Required:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key (writes are guarded by RLS) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway (omit on Vercel to use OIDC) |

`SUPABASE_SERVICE_ROLE_KEY` is optional; if set, the server prefers it over the
publishable key.

## Database setup (and switching Supabase projects)

The schema is fully captured in `supabase/migrations/`, so a brand-new project
provisions from scratch with no manual steps:

1. Create the Supabase project.
2. Apply the migrations in order:
   ```bash
   supabase link --project-ref <new-project-ref>
   supabase db push          # applies 0001 (table) + 0002 (RLS, grants, PII)
   ```
   (Or run each `.sql` file via the SQL editor / `apply_migration`.)
3. Update `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in
   `.env.local` and in the Vercel project settings.

`0002_media_kits_rls.sql` enables Row Level Security, allows the public role to
read only published kits and insert constrained rows, and blocks public reads of
the `email` column.

## Testing

```bash
pnpm test     # unit + integration (Vitest)
pnpm e2e      # one happy-path E2E (Playwright; needs a real .env.local)
```

## Deploy

Deployed on [Vercel](https://vercel.com). Set the environment variables above in
the project settings, then push to the connected branch.
