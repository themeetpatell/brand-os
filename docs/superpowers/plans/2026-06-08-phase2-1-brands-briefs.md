# Phase 2.1 — Brand Accounts + Briefs + Matched Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A brand can sign up, post a brief, and matched creators (right niche/region, budget ≥ their floor) see it in a feed — the demand-side foundation of the L2 marketplace.

**Architecture:** Mirror the shipped money-cockpit seams exactly. Pure domain (Zod) + pure matching function + repository interface (in-memory for tests, Supabase for runtime) + a use-case + thin API routes + minimal client pages. Brand identity is a `brands` row keyed to `auth.uid()` (like `creators`). "Broadcast" is a matched query, not push infrastructure.

**Tech Stack:** TypeScript, Next.js 16 App Router, Supabase (`@supabase/supabase-js`), Zod, Vitest. Reuses: `createServiceClient`, the auth bearer-token helper, the repository/use-case patterns from `deal-repository.ts` / `log-deal.ts`.

**Spec:** `docs/superpowers/specs/2026-06-08-phase2-marketplace-design.md` (P2.1 + P2.2).

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/domain/types.ts` (modify) | Add `BRIEF_STATUSES`, `BriefStatus`, `BriefInputSchema`, `BriefInput` |
| `src/lib/matching/brief-match.ts` | `creatorMatchesBrief` (pure) |
| `src/lib/repository/brief-repository.ts` | `Brief` record + `BriefRepository` interface |
| `src/lib/repository/in-memory-brief-repository.ts` | In-memory impl (tests) |
| `src/lib/repository/supabase-brief-repository.ts` | Supabase impl (runtime) |
| `src/lib/services/post-brief.ts` | `postBrief` use-case (validate → persist) |
| `src/lib/auth/server.ts` (modify) | Add `getUserIdFromRequest` |
| `src/lib/server/deps.ts` (modify) | Add `briefRepo` to `ServerDeps` |
| `supabase/migrations/0005_brands.sql` | `brands` table + RLS |
| `supabase/migrations/0006_creator_match_fields.sql` | add `niche`, `region` to `creators` |
| `supabase/migrations/0007_briefs.sql` | `briefs` table + RLS |
| `src/app/api/briefs/route.ts` | POST (brand posts) + GET (creator matched feed) |
| `src/app/brand/page.tsx` | Brand dashboard: post + list own briefs |
| `src/app/briefs/page.tsx` | Creator matched-briefs feed |

---

## Task 1: Brief domain schema

**Files:**
- Modify: `src/lib/domain/types.ts`
- Test: `src/lib/domain/brief.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/domain/brief.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { BriefInputSchema } from './types'

const valid = {
  title: 'Summer skincare launch',
  goal: 'Drive trial of a new SPF among college students',
  budgetMin: 8000,
  budgetMax: 25000,
  currency: 'INR',
  niche: 'beauty',
  region: 'IN',
  deliverables: ['1 reel', '2 stories'],
}

describe('BriefInputSchema', () => {
  it('accepts a valid brief', () => {
    expect(BriefInputSchema.parse(valid).niche).toBe('beauty')
  })

  it('rejects budgetMax below budgetMin', () => {
    expect(() => BriefInputSchema.parse({ ...valid, budgetMin: 25000, budgetMax: 8000 })).toThrow()
  })

  it('rejects an empty title', () => {
    expect(() => BriefInputSchema.parse({ ...valid, title: '' })).toThrow()
  })

  it('rejects an unknown niche', () => {
    expect(() => BriefInputSchema.parse({ ...valid, niche: 'crypto' })).toThrow()
  })

  it('rejects an empty deliverables list', () => {
    expect(() => BriefInputSchema.parse({ ...valid, deliverables: [] })).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/domain/brief.test.ts`
Expected: FAIL — `BriefInputSchema` is undefined.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/domain/types.ts`, after the `DealInputSchema` block, add:
```ts
export const BRIEF_STATUSES = ['open', 'closed', 'filled'] as const
export type BriefStatus = (typeof BRIEF_STATUSES)[number]

export const BriefInputSchema = z
  .object({
    title: z.string().min(1).max(120),
    goal: z.string().min(1).max(500),
    budgetMin: z.number().positive(),
    budgetMax: z.number().positive(),
    currency: z.enum(CURRENCIES),
    niche: z.enum(NICHES),
    region: z.enum(REGIONS),
    deliverables: z.array(z.string().min(1)).min(1).max(20),
  })
  .refine((b) => b.budgetMax >= b.budgetMin, {
    message: 'budgetMax must be >= budgetMin',
    path: ['budgetMax'],
  })
export type BriefInput = z.infer<typeof BriefInputSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/domain/brief.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/domain/types.ts src/lib/domain/brief.test.ts
git commit -m "feat: add brief domain schema"
```

---

## Task 2: Brief matching (pure)

**Files:**
- Create: `src/lib/matching/brief-match.ts`
- Test: `src/lib/matching/brief-match.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/matching/brief-match.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { creatorMatchesBrief } from './brief-match'
import type { CreatorMatchProfile, BriefMatchFields } from './brief-match'

const creator: CreatorMatchProfile = { niche: 'beauty', region: 'IN', rateFloor: 10000 }
const brief: BriefMatchFields = { niche: 'beauty', region: 'IN', budgetMax: 25000, status: 'open' }

describe('creatorMatchesBrief', () => {
  it('matches same niche + region when budget covers the floor', () => {
    expect(creatorMatchesBrief(creator, brief)).toBe(true)
  })

  it('rejects a different niche', () => {
    expect(creatorMatchesBrief(creator, { ...brief, niche: 'fashion' })).toBe(false)
  })

  it('rejects a different region', () => {
    expect(creatorMatchesBrief(creator, { ...brief, region: 'AE' })).toBe(false)
  })

  it('rejects when the budget cannot cover the floor', () => {
    expect(creatorMatchesBrief(creator, { ...brief, budgetMax: 9000 })).toBe(false)
  })

  it('rejects a non-open brief', () => {
    expect(creatorMatchesBrief(creator, { ...brief, status: 'filled' })).toBe(false)
  })

  it('matches when the creator has no floor set', () => {
    expect(creatorMatchesBrief({ ...creator, rateFloor: null }, { ...brief, budgetMax: 1 })).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/matching/brief-match.test.ts`
Expected: FAIL — cannot find module './brief-match'.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/matching/brief-match.ts`:
```ts
import type { Niche, Region, BriefStatus } from '../domain/types'

export interface CreatorMatchProfile {
  niche: Niche
  region: Region
  rateFloor: number | null
}

export interface BriefMatchFields {
  niche: Niche
  region: Region
  budgetMax: number
  status: BriefStatus
}

// A creator matches an OPEN brief in her niche+region whose budget can cover her floor.
export function creatorMatchesBrief(
  creator: CreatorMatchProfile,
  brief: BriefMatchFields,
): boolean {
  if (brief.status !== 'open') return false
  if (brief.niche !== creator.niche) return false
  if (brief.region !== creator.region) return false
  if (creator.rateFloor !== null && brief.budgetMax < creator.rateFloor) return false
  return true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/matching/brief-match.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/matching/brief-match.ts src/lib/matching/brief-match.test.ts
git commit -m "feat: add brief matching logic"
```

---

## Task 3: Brief repository interface + in-memory impl

**Files:**
- Create: `src/lib/repository/brief-repository.ts`
- Create: `src/lib/repository/in-memory-brief-repository.ts`
- Test: `src/lib/repository/in-memory-brief-repository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/repository/in-memory-brief-repository.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { InMemoryBriefRepository } from './in-memory-brief-repository'
import type { Brief } from './brief-repository'

function makeBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    id: 'brief_1',
    brandId: 'brand_1',
    title: 'Summer skincare launch',
    goal: 'Drive trial',
    budgetMin: 8000,
    budgetMax: 25000,
    currency: 'INR',
    niche: 'beauty',
    region: 'IN',
    deliverables: ['1 reel'],
    status: 'open',
    createdAt: '2026-06-08T00:00:00.000Z',
    ...overrides,
  }
}

describe('InMemoryBriefRepository', () => {
  it('saves and retrieves a brief by id', async () => {
    const repo = new InMemoryBriefRepository()
    await repo.saveBrief(makeBrief())
    expect((await repo.getBriefById('brief_1'))?.title).toBe('Summer skincare launch')
  })

  it('returns null for an unknown id', async () => {
    const repo = new InMemoryBriefRepository()
    expect(await repo.getBriefById('missing')).toBeNull()
  })

  it('lists only the given brand briefs', async () => {
    const repo = new InMemoryBriefRepository()
    await repo.saveBrief(makeBrief({ id: 'b1', brandId: 'brand_1' }))
    await repo.saveBrief(makeBrief({ id: 'b2', brandId: 'brand_2' }))
    const briefs = await repo.listBriefsByBrand('brand_1')
    expect(briefs.map((b) => b.id)).toEqual(['b1'])
  })

  it('lists only open briefs', async () => {
    const repo = new InMemoryBriefRepository()
    await repo.saveBrief(makeBrief({ id: 'b1', status: 'open' }))
    await repo.saveBrief(makeBrief({ id: 'b2', status: 'filled' }))
    const open = await repo.listOpenBriefs()
    expect(open.map((b) => b.id)).toEqual(['b1'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/repository/in-memory-brief-repository.test.ts`
Expected: FAIL — cannot find module './in-memory-brief-repository'.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/repository/brief-repository.ts`:
```ts
import type { BriefInput, BriefStatus } from '../domain/types'

export interface Brief extends BriefInput {
  id: string
  brandId: string
  status: BriefStatus
  createdAt: string
}

export interface BriefRepository {
  saveBrief(brief: Brief): Promise<void>
  getBriefById(id: string): Promise<Brief | null>
  listBriefsByBrand(brandId: string): Promise<Brief[]>
  listOpenBriefs(): Promise<Brief[]>
}
```

Create `src/lib/repository/in-memory-brief-repository.ts`:
```ts
import type { Brief, BriefRepository } from './brief-repository'

export class InMemoryBriefRepository implements BriefRepository {
  private readonly store = new Map<string, Brief>()

  async saveBrief(brief: Brief): Promise<void> {
    this.store.set(brief.id, brief)
  }

  async getBriefById(id: string): Promise<Brief | null> {
    return this.store.get(id) ?? null
  }

  async listBriefsByBrand(brandId: string): Promise<Brief[]> {
    return [...this.store.values()].filter((b) => b.brandId === brandId)
  }

  async listOpenBriefs(): Promise<Brief[]> {
    return [...this.store.values()].filter((b) => b.status === 'open')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/repository/in-memory-brief-repository.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/repository/brief-repository.ts src/lib/repository/in-memory-brief-repository.ts src/lib/repository/in-memory-brief-repository.test.ts
git commit -m "feat: add brief repository interface and in-memory impl"
```

---

## Task 4: post-brief use-case

**Files:**
- Create: `src/lib/services/post-brief.ts`
- Test: `src/lib/services/post-brief.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/services/post-brief.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { postBrief } from './post-brief'
import { InMemoryBriefRepository } from '../repository/in-memory-brief-repository'

const validBody = {
  title: 'Summer skincare launch',
  goal: 'Drive trial',
  budgetMin: 8000,
  budgetMax: 25000,
  currency: 'INR',
  niche: 'beauty',
  region: 'IN',
  deliverables: ['1 reel', '2 stories'],
}

const deps = () => ({
  repo: new InMemoryBriefRepository(),
  idGen: () => 'brief_abc',
  now: () => '2026-06-08T00:00:00.000Z',
})

describe('postBrief', () => {
  it('persists an open brief and returns it', async () => {
    const d = deps()
    const brief = await postBrief('brand_1', validBody, d)
    expect(brief.id).toBe('brief_abc')
    expect(brief.brandId).toBe('brand_1')
    expect(brief.status).toBe('open')
    expect(brief.createdAt).toBe('2026-06-08T00:00:00.000Z')
    expect((await d.repo.getBriefById('brief_abc'))?.title).toBe('Summer skincare launch')
  })

  it('throws on an invalid body', async () => {
    await expect(postBrief('brand_1', { title: '' }, deps())).rejects.toThrow()
  })

  it('throws when brandId is missing', async () => {
    await expect(postBrief('', validBody, deps())).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/services/post-brief.test.ts`
Expected: FAIL — cannot find module './post-brief'.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/services/post-brief.ts`:
```ts
import { nanoid } from 'nanoid'
import { BriefInputSchema } from '../domain/types'
import type { Brief, BriefRepository } from '../repository/brief-repository'
import type { IdGenerator } from '../repository/slug'
import type { Clock } from './log-deal'

export interface PostBriefDeps {
  repo: BriefRepository
  idGen?: IdGenerator
  now?: Clock
}

export async function postBrief(
  brandId: string,
  body: unknown,
  deps: PostBriefDeps,
): Promise<Brief> {
  if (!brandId) {
    throw new Error('brandId is required')
  }
  const input = BriefInputSchema.parse(body)
  const idGen = deps.idGen ?? (() => nanoid())
  const now = deps.now ?? (() => new Date().toISOString())

  const brief: Brief = {
    ...input,
    id: idGen(),
    brandId,
    status: 'open',
    createdAt: now(),
  }
  await deps.repo.saveBrief(brief)
  return brief
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/services/post-brief.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/services/post-brief.ts src/lib/services/post-brief.test.ts
git commit -m "feat: add post-brief use-case"
```

---

## Task 5: Migrations (brands, creator match fields, briefs) + Supabase brief repository

**Files:**
- Create: `supabase/migrations/0005_brands.sql`
- Create: `supabase/migrations/0006_creator_match_fields.sql`
- Create: `supabase/migrations/0007_briefs.sql`
- Create: `src/lib/repository/supabase-brief-repository.ts`

No unit test (network). Verified by applying the migration + `tsc`.

- [ ] **Step 1: Write the brands migration**

Create `supabase/migrations/0005_brands.sql`:
```sql
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
```

- [ ] **Step 2: Write the creator match fields migration**

Create `supabase/migrations/0006_creator_match_fields.sql`:
```sql
-- Denormalized onto creators so the matched-briefs query is a clean filter.
alter table public.creators add column if not exists niche text;
alter table public.creators add column if not exists region text;
```

- [ ] **Step 3: Write the briefs migration**

Create `supabase/migrations/0007_briefs.sql`:
```sql
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

-- Brand owns its briefs.
drop policy if exists briefs_brand_all on public.briefs;
create policy briefs_brand_all on public.briefs
  for all to authenticated using (auth.uid() = brand_id) with check (auth.uid() = brand_id);

-- Any authenticated user may read OPEN briefs (briefs are meant to be discovered;
-- the niche/region/floor match is applied in the app layer).
drop policy if exists briefs_read_open on public.briefs;
create policy briefs_read_open on public.briefs
  for select to authenticated using (status = 'open');
```

- [ ] **Step 4: Apply the migrations**

Apply `0005`, `0006`, `0007` via the Supabase MCP `apply_migration` tool or `supabase db push`. Then run `get_advisors` (security) — expect no new lints (`brands`/`briefs` have policies; an INFO lint for any RLS-no-policy table is acceptable only if intentional).

- [ ] **Step 5: Implement the Supabase brief repository**

Create `src/lib/repository/supabase-brief-repository.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Currency, BriefStatus, Niche, Region } from '../domain/types'
import type { Brief, BriefRepository } from './brief-repository'

interface BriefRow {
  id: string
  brand_id: string
  title: string
  goal: string
  budget_min: number | string
  budget_max: number | string
  currency: string
  niche: string
  region: string
  deliverables: string[]
  status: string
  created_at: string
}

function toBrief(row: BriefRow): Brief {
  return {
    id: row.id,
    brandId: row.brand_id,
    title: row.title,
    goal: row.goal,
    budgetMin: Number(row.budget_min),
    budgetMax: Number(row.budget_max),
    currency: row.currency as Currency,
    niche: row.niche as Niche,
    region: row.region as Region,
    deliverables: row.deliverables,
    status: row.status as BriefStatus,
    createdAt: row.created_at,
  }
}

export class SupabaseBriefRepository implements BriefRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveBrief(brief: Brief): Promise<void> {
    const { error } = await this.client.from('briefs').upsert({
      id: brief.id,
      brand_id: brief.brandId,
      title: brief.title,
      goal: brief.goal,
      budget_min: brief.budgetMin,
      budget_max: brief.budgetMax,
      currency: brief.currency,
      niche: brief.niche,
      region: brief.region,
      deliverables: brief.deliverables,
      status: brief.status,
      created_at: brief.createdAt,
    })
    if (error) throw new Error(`saveBrief failed: ${error.message}`)
  }

  async getBriefById(id: string): Promise<Brief | null> {
    const { data, error } = await this.client
      .from('briefs')
      .select('*')
      .eq('id', id)
      .maybeSingle<BriefRow>()
    if (error) throw new Error(`getBriefById failed: ${error.message}`)
    return data ? toBrief(data) : null
  }

  async listBriefsByBrand(brandId: string): Promise<Brief[]> {
    const { data, error } = await this.client
      .from('briefs')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .returns<BriefRow[]>()
    if (error) throw new Error(`listBriefsByBrand failed: ${error.message}`)
    return (data ?? []).map(toBrief)
  }

  async listOpenBriefs(): Promise<Brief[]> {
    const { data, error } = await this.client
      .from('briefs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .returns<BriefRow[]>()
    if (error) throw new Error(`listOpenBriefs failed: ${error.message}`)
    return (data ?? []).map(toBrief)
  }
}
```

- [ ] **Step 6: Verify types compile**

Run: `pnpm tsc --noEmit`
Expected: no type errors.

- [ ] **Step 7: Commit**
```bash
git add supabase/migrations/0005_brands.sql supabase/migrations/0006_creator_match_fields.sql supabase/migrations/0007_briefs.sql src/lib/repository/supabase-brief-repository.ts
git commit -m "feat: add brands/briefs migrations and supabase brief repository"
```

---

## Task 6: Auth helper + deps wiring

**Files:**
- Modify: `src/lib/auth/server.ts`
- Modify: `src/lib/server/deps.ts`

- [ ] **Step 1: Add `getUserIdFromRequest`**

In `src/lib/auth/server.ts`, add below the existing `getCreatorIdFromRequest` (which stays unchanged):
```ts
// Same Bearer-token validation, named for any authenticated actor (creator or brand).
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  return getCreatorIdFromRequest(request)
}
```

- [ ] **Step 2: Add the brief repo to ServerDeps**

In `src/lib/server/deps.ts`:
- Add import: `import { SupabaseBriefRepository } from '../repository/supabase-brief-repository'`
- Add import: `import type { BriefRepository } from '../repository/brief-repository'`
- Add `briefRepo: BriefRepository` to the `ServerDeps` interface.
- In `getServerDeps()`, add `briefRepo: new SupabaseBriefRepository(client),` to the returned object.

- [ ] **Step 3: Verify types compile**

Run: `pnpm tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4: Commit**
```bash
git add src/lib/auth/server.ts src/lib/server/deps.ts
git commit -m "feat: add getUserIdFromRequest and wire brief repo into deps"
```

---

## Task 7: POST/GET /api/briefs route

**Files:**
- Create: `src/app/api/briefs/route.ts`
- Test: `src/app/api/briefs/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/briefs/route.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'

const saved: unknown[] = []

vi.mock('../../../lib/server/deps', () => ({
  getServerDeps: () => ({
    briefRepo: {
      saveBrief: vi.fn(async (b: unknown) => { saved.push(b) }),
      listOpenBriefs: vi.fn(async () => [
        { id: 'b1', brandId: 'brand_1', title: 'T', goal: 'g', budgetMin: 8000, budgetMax: 25000, currency: 'INR', niche: 'beauty', region: 'IN', deliverables: ['1 reel'], status: 'open', createdAt: 't' },
        { id: 'b2', brandId: 'brand_1', title: 'T2', goal: 'g', budgetMin: 8000, budgetMax: 9000, currency: 'INR', niche: 'fashion', region: 'IN', deliverables: ['1 reel'], status: 'open', createdAt: 't' },
      ],
    },
  }),
}))
vi.mock('../../../lib/auth/server', () => ({
  getUserIdFromRequest: async (req: Request) =>
    req.headers.get('authorization') === 'Bearer brand' || req.headers.get('authorization') === 'Bearer creator'
      ? req.headers.get('authorization')!.slice('Bearer '.length)
      : null,
}))
vi.mock('../../../lib/supabase/server-client', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'brand', name: 'B' } }) }) }),
    }),
  }),
}))

import { POST, GET } from './route'

function req(auth: string | null, body?: unknown): Request {
  return new Request('http://localhost/api/briefs', {
    method: body ? 'POST' : 'GET',
    headers: auth ? { authorization: auth, 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

const validBrief = {
  title: 'Summer skincare', goal: 'trial', budgetMin: 8000, budgetMax: 25000,
  currency: 'INR', niche: 'beauty', region: 'IN', deliverables: ['1 reel'],
}

describe('POST /api/briefs', () => {
  it('returns 201 for a valid brand brief', async () => {
    const res = await POST(req('Bearer brand', validBrief))
    expect(res.status).toBe(201)
  })

  it('returns 401 without auth', async () => {
    expect((await POST(req(null, validBrief))).status).toBe(401)
  })

  it('returns 400 for an invalid brief', async () => {
    expect((await POST(req('Bearer brand', { title: '' }))).status).toBe(400)
  })
})
```

(GET is exercised in Task 8 manual verification; the POST tests above lock the route contract.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/briefs/route.test.ts`
Expected: FAIL — cannot find module './route'.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/api/briefs/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getUserIdFromRequest } from '../../../lib/auth/server'
import { getServerDeps } from '../../../lib/server/deps'
import { createServiceClient } from '../../../lib/supabase/server-client'
import { postBrief } from '../../../lib/services/post-brief'
import { creatorMatchesBrief } from '../../../lib/matching/brief-match'
import type { Niche, Region } from '../../../lib/domain/types'

export async function POST(request: Request): Promise<Response> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Must be a brand (has a brands row).
  const { data: brand } = await createServiceClient()
    .from('brands')
    .select('id')
    .eq('id', userId)
    .maybeSingle<{ id: string }>()
  if (!brand) {
    return NextResponse.json({ error: 'Not a brand account' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const deps = getServerDeps()
    const brief = await postBrief(userId, body, { repo: deps.briefRepo })
    return NextResponse.json(brief, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((i) => ({ path: i.path, message: i.message }))
      return NextResponse.json({ error: 'Invalid input', issues }, { status: 400 })
    }
    console.error('post brief failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: Request): Promise<Response> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The creator's match profile.
  const { data: creator } = await createServiceClient()
    .from('creators')
    .select('niche, region, rate_floor')
    .eq('id', userId)
    .maybeSingle<{ niche: string | null; region: string | null; rate_floor: number | null }>()
  if (!creator || !creator.niche || !creator.region) {
    return NextResponse.json({ error: 'Complete your creator profile first' }, { status: 403 })
  }

  try {
    const deps = getServerDeps()
    const open = await deps.briefRepo.listOpenBriefs()
    const matched = open.filter((brief) =>
      creatorMatchesBrief(
        {
          niche: creator.niche as Niche,
          region: creator.region as Region,
          rateFloor: creator.rate_floor === null ? null : Number(creator.rate_floor),
        },
        { niche: brief.niche, region: brief.region, budgetMax: brief.budgetMax, status: brief.status },
      ),
    )
    return NextResponse.json({ briefs: matched }, { status: 200 })
  } catch (error) {
    console.error('list matched briefs failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/briefs/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/app/api/briefs/route.ts src/app/api/briefs/route.test.ts
git commit -m "feat: add POST/GET /api/briefs endpoint"
```

---

## Task 8: Brand dashboard + creator briefs feed UI

**Files:**
- Create: `src/app/brand/page.tsx`
- Create: `src/app/briefs/page.tsx`

UI tasks; verified manually (and by the route tests above).

- [ ] **Step 1: Implement the brand dashboard**

Create `src/app/brand/page.tsx`:
```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../lib/supabase/browser-client'

interface Brief {
  id: string
  title: string
  budgetMin: number
  budgetMax: number
  currency: string
  niche: string
  region: string
  status: string
}

export default function BrandPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [error, setError] = useState<string | null>(null)

  const authFetch = useCallback(
    (path: string, init: RequestInit = {}) =>
      fetch(path, { ...init, headers: { ...init.headers, authorization: `Bearer ${token}`, 'content-type': 'application/json' } }),
    [token],
  )

  useEffect(() => {
    const supabase = getBrowserClient()
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) {
        router.push('/login')
        return
      }
      setToken(session.access_token)
      const user = session.user
      const name = (user.email ?? 'brand').split('@')[0]
      await supabase
        .from('brands')
        .upsert({ id: user.id, name, email: user.email }, { onConflict: 'id', ignoreDuplicates: true })
    })
  }, [router])

  async function postBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const payload = {
      title: String(form.get('title')),
      goal: String(form.get('goal')),
      budgetMin: Number(form.get('budgetMin')),
      budgetMax: Number(form.get('budgetMax')),
      currency: String(form.get('currency')),
      niche: String(form.get('niche')),
      region: String(form.get('region')),
      deliverables: String(form.get('deliverables')).split(',').map((d) => d.trim()).filter(Boolean),
    }
    const res = await authFetch('/api/briefs', { method: 'POST', body: JSON.stringify(payload) })
    if (!res.ok) {
      setError('Could not post the brief. Check your inputs.')
      return
    }
    const brief = await res.json()
    setBriefs((prev) => [brief, ...prev])
    event.currentTarget.reset()
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Post a brief</h1>
      <form onSubmit={postBrief} className="mt-6 space-y-3" data-testid="brief-form">
        <input name="title" required placeholder="campaign title" className="w-full rounded border p-2" />
        <textarea name="goal" required placeholder="goal" className="w-full rounded border p-2" />
        <div className="flex gap-3">
          <input name="budgetMin" type="number" min={1} required placeholder="budget min" className="w-full rounded border p-2" />
          <input name="budgetMax" type="number" min={1} required placeholder="budget max" className="w-full rounded border p-2" />
          <select name="currency" className="rounded border p-2"><option value="INR">INR</option><option value="AED">AED</option></select>
        </div>
        <div className="flex gap-3">
          <select name="niche" className="w-full rounded border p-2">
            {['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          <select name="region" className="w-full rounded border p-2"><option value="IN">India</option><option value="AE">UAE</option></select>
        </div>
        <input name="deliverables" required placeholder="deliverables (comma separated)" className="w-full rounded border p-2" />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">Post brief</button>
      </form>

      <section className="mt-8">
        <h2 className="font-medium">Posted this session</h2>
        <ul className="mt-2 space-y-2" data-testid="brand-briefs">
          {briefs.map((b) => (
            <li key={b.id} className="rounded border p-3 text-sm">
              <span className="font-medium">{b.title}</span> · {b.currency} {b.budgetMin.toLocaleString()}–{b.budgetMax.toLocaleString()} · {b.niche}/{b.region}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Implement the creator briefs feed**

Create `src/app/briefs/page.tsx`:
```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../lib/supabase/browser-client'

interface Brief {
  id: string
  title: string
  goal: string
  budgetMin: number
  budgetMax: number
  currency: string
  niche: string
  region: string
  deliverables: string[]
}

export default function BriefsFeedPage() {
  const router = useRouter()
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async (token: string) => {
    const res = await fetch('/api/briefs', { headers: { authorization: `Bearer ${token}` } })
    if (res.ok) {
      setBriefs((await res.json()).briefs)
    } else {
      setMessage('Complete your creator profile (niche + region) to see matched briefs.')
    }
  }, [])

  useEffect(() => {
    getBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.push('/login')
          return
        }
        load(data.session.access_token)
      })
  }, [router, load])

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Briefs for you</h1>
      {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
      <ul className="mt-6 space-y-3" data-testid="briefs-feed">
        {briefs.map((b) => (
          <li key={b.id} className="rounded border p-4">
            <div className="font-medium">{b.title}</div>
            <p className="mt-1 text-sm text-gray-600">{b.goal}</p>
            <p className="mt-2 text-sm">{b.currency} {b.budgetMin.toLocaleString()}–{b.budgetMax.toLocaleString()} · {b.deliverables.join(', ')}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 3: Verify it builds**

Run: `pnpm build`
Expected: clean build; routes `/brand` and `/briefs` listed.

- [ ] **Step 4: Commit**
```bash
git add src/app/brand/page.tsx src/app/briefs/page.tsx
git commit -m "feat: add brand dashboard and creator briefs feed"
```

---

## Task 9: Full test pass + build

- [ ] **Step 1: Run the whole suite**

Run: `pnpm test`
Expected: all tests pass (existing 50 + the new brief tests).

- [ ] **Step 2: Typecheck + build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: no type errors, clean production build.

- [ ] **Step 3: Manual end-to-end check** (requires the live Supabase project + env)

Sign in at `/login`, visit `/brand`, post a brief. Then as a creator account whose profile has matching `niche`/`region` (set on the `creators` row), visit `/briefs` and confirm the brief appears. Confirm a non-matching niche does NOT appear.

- [ ] **Step 4: Commit any fixups**
```bash
git add -A
git commit -m "test: phase 2.1 brands + briefs full pass"
```

---

## Notes / follow-ups (next plans)
- **P2.3 Applications:** creator applies to a brief (offer-agent drafts the floor-aware quote); brand accepts → creates a `Deal` (reuse `Deal` + `markDealPaid`). Adds `applications` table + `brief_id`/`brand_id`/`application_id` on `deals`.
- **P2.4 Escrow:** extend `PaymentsProvider` with `createEscrowFunding`/`releaseEscrow`; deal escrow state machine.
- **Creator profile niche/region:** this plan adds the columns; populate them when a creator creates/edits their kit (wire in P2.3 or a small follow-up so `/briefs` has data to match on).
- **Brand telemetry:** `funnel_events.creator_id` is FK→creators, so brand-side events are deferred to P2.6 (generalize to `actor_id` there).
