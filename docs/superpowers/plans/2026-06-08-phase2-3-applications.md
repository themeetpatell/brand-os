# Phase 2.3 — Applications (apply → accept → deal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A creator sets her profile (niche/region/floor), sees matched briefs, and applies with an agent-suggested quote; a brand reviews applicants and accepts one — which mints a real deal in the creator's cockpit.

**Architecture:** Mirror the shipped P2.1 seams exactly (pure domain + matching, repository interface with in-memory + Supabase impls, thin use-cases, thin API routes, minimal client UI). `acceptApplication` creates a `Deal` via the existing `DealRepository`, so an accepted brief immediately appears in the creator's cockpit. Escrow/linkage columns are deferred to P2.4.

**Tech Stack:** TypeScript, Next.js 16 App Router, Supabase, Zod, Vitest. Reuses `Deal`/`DealRepository`, `BriefRepository`, `getUserIdFromRequest`, `createServiceClient`, `getServerDeps`, the `EventSink`, and the Zod-boundary route pattern.

**Spec:** `docs/superpowers/specs/2026-06-08-phase2-marketplace-design.md` (§3c).

**Decisions baked in:** one application per (brief, creator); a quote is any positive amount (the agent *suggests* clamping to the brief budget, but the creator may exceed it); accept creates a `Deal` in status `accepted` (escrow moves it to `paid` in P2.4) and sets the brief `filled`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/domain/types.ts` (modify) | `APPLICATION_STATUSES`, `ApplicationStatus`, `ApplicationInputSchema`, `CreatorProfileSchema` |
| `src/lib/matching/suggest-quote.ts` | `suggestQuote` (pure) |
| `src/lib/repository/application-repository.ts` | `Application` + `ApplicationRepository` |
| `src/lib/repository/in-memory-application-repository.ts` | In-memory impl (tests) |
| `src/lib/repository/supabase-application-repository.ts` | Supabase impl (runtime) |
| `src/lib/services/apply-to-brief.ts` | `applyToBrief` use-case |
| `src/lib/services/accept-application.ts` | `acceptApplication` use-case (creates a `Deal`) |
| `src/lib/server/deps.ts` (modify) | add `appRepo` to `ServerDeps` |
| `supabase/migrations/0009_applications.sql` | `applications` table + RLS |
| `src/app/api/profile/route.ts` | POST — creator sets niche/region/rate_floor |
| `src/app/api/briefs/[id]/apply/route.ts` | POST — creator applies |
| `src/app/api/briefs/[id]/applications/route.ts` | GET — brand lists applicants |
| `src/app/api/applications/[id]/accept/route.ts` | POST — brand accepts → deal |
| `src/app/dashboard/page.tsx` (modify) | add a profile (niche/region/floor) editor |
| `src/app/briefs/page.tsx` (modify) | add an Apply form per brief |
| `src/app/brand/page.tsx` (modify) | view + accept applicants per brief |

---

## Task 1: Application + profile domain schemas

**Files:** Modify `src/lib/domain/types.ts` · Test `src/lib/domain/application.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/domain/application.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { ApplicationInputSchema, CreatorProfileSchema } from './types'

describe('ApplicationInputSchema', () => {
  it('accepts a valid application', () => {
    expect(ApplicationInputSchema.parse({ quoteAmount: 18000, message: 'I love this brand.' }).quoteAmount).toBe(18000)
  })
  it('rejects a non-positive quote', () => {
    expect(() => ApplicationInputSchema.parse({ quoteAmount: 0, message: 'hi' })).toThrow()
  })
  it('rejects an empty message', () => {
    expect(() => ApplicationInputSchema.parse({ quoteAmount: 1000, message: '' })).toThrow()
  })
})

describe('CreatorProfileSchema', () => {
  it('accepts a valid profile', () => {
    expect(CreatorProfileSchema.parse({ niche: 'beauty', region: 'IN', rateFloor: 12000 }).niche).toBe('beauty')
  })
  it('rejects an unknown niche', () => {
    expect(() => CreatorProfileSchema.parse({ niche: 'crypto', region: 'IN', rateFloor: 1 })).toThrow()
  })
  it('rejects a non-positive floor', () => {
    expect(() => CreatorProfileSchema.parse({ niche: 'beauty', region: 'IN', rateFloor: 0 })).toThrow()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/lib/domain/application.test.ts` → FAIL (undefined schemas).

- [ ] **Step 3: Implement** — append to `src/lib/domain/types.ts` (after the `BriefInput` block; `z`, `NICHES`, `REGIONS` already in scope):
```ts
export const APPLICATION_STATUSES = ['applied', 'accepted', 'declined', 'withdrawn'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const ApplicationInputSchema = z.object({
  quoteAmount: z.number().positive(),
  message: z.string().min(1).max(600),
})
export type ApplicationInput = z.infer<typeof ApplicationInputSchema>

export const CreatorProfileSchema = z.object({
  niche: z.enum(NICHES),
  region: z.enum(REGIONS),
  rateFloor: z.number().positive(),
})
export type CreatorProfile = z.infer<typeof CreatorProfileSchema>
```

- [ ] **Step 4: Run to verify it passes** → `pnpm vitest run src/lib/domain/application.test.ts` (6 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/domain/types.ts src/lib/domain/application.test.ts
git commit -m "feat: add application + creator-profile schemas"
```

---

## Task 2: suggestQuote (pure)

**Files:** Create `src/lib/matching/suggest-quote.ts` · Test `src/lib/matching/suggest-quote.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/matching/suggest-quote.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { suggestQuote } from './suggest-quote'

describe('suggestQuote', () => {
  it('uses the floor when it sits inside the budget', () => {
    expect(suggestQuote(15000, 8000, 25000)).toBe(15000)
  })
  it('clamps up to the budget minimum when the floor is below it', () => {
    expect(suggestQuote(5000, 8000, 25000)).toBe(8000)
  })
  it('clamps down to the budget maximum when the floor exceeds it', () => {
    expect(suggestQuote(40000, 8000, 25000)).toBe(25000)
  })
  it('falls back to the budget minimum when there is no floor', () => {
    expect(suggestQuote(null, 8000, 25000)).toBe(8000)
  })
})
```

- [ ] **Step 2: Run to verify it fails** → FAIL (module not found).

- [ ] **Step 3: Implement** — create `src/lib/matching/suggest-quote.ts`:
```ts
// The agent's suggested quote: the creator's floor, clamped into the brief budget.
export function suggestQuote(floor: number | null, budgetMin: number, budgetMax: number): number {
  const base = floor ?? budgetMin
  return Math.min(Math.max(base, budgetMin), budgetMax)
}
```

- [ ] **Step 4: Run to verify it passes** → (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/matching/suggest-quote.ts src/lib/matching/suggest-quote.test.ts
git commit -m "feat: add suggestQuote helper"
```

---

## Task 3: Application repository + in-memory impl

**Files:** Create `src/lib/repository/application-repository.ts`, `src/lib/repository/in-memory-application-repository.ts` · Test `src/lib/repository/in-memory-application-repository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/repository/in-memory-application-repository.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { InMemoryApplicationRepository } from './in-memory-application-repository'
import type { Application } from './application-repository'

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app_1', briefId: 'brief_1', creatorId: 'creator_1',
    quoteAmount: 18000, currency: 'INR', message: 'hi', status: 'applied',
    createdAt: '2026-06-08T00:00:00.000Z', ...overrides,
  }
}

describe('InMemoryApplicationRepository', () => {
  it('saves and gets by id', async () => {
    const repo = new InMemoryApplicationRepository()
    await repo.saveApplication(makeApp())
    expect((await repo.getApplicationById('app_1'))?.quoteAmount).toBe(18000)
  })
  it('returns null for an unknown id', async () => {
    expect(await new InMemoryApplicationRepository().getApplicationById('x')).toBeNull()
  })
  it('lists applications by brief', async () => {
    const repo = new InMemoryApplicationRepository()
    await repo.saveApplication(makeApp({ id: 'a1', briefId: 'b1' }))
    await repo.saveApplication(makeApp({ id: 'a2', briefId: 'b2' }))
    expect((await repo.listApplicationsByBrief('b1')).map((a) => a.id)).toEqual(['a1'])
  })
  it('finds an existing application by brief + creator', async () => {
    const repo = new InMemoryApplicationRepository()
    await repo.saveApplication(makeApp({ briefId: 'b1', creatorId: 'c1' }))
    expect(await repo.findApplication('b1', 'c1')).not.toBeNull()
    expect(await repo.findApplication('b1', 'c2')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Implement**

Create `src/lib/repository/application-repository.ts`:
```ts
import type { ApplicationInput, ApplicationStatus, Currency } from '../domain/types'

export interface Application extends ApplicationInput {
  id: string
  briefId: string
  creatorId: string
  currency: Currency
  status: ApplicationStatus
  createdAt: string
}

export interface ApplicationRepository {
  saveApplication(app: Application): Promise<void>
  getApplicationById(id: string): Promise<Application | null>
  listApplicationsByBrief(briefId: string): Promise<Application[]>
  findApplication(briefId: string, creatorId: string): Promise<Application | null>
}
```

Create `src/lib/repository/in-memory-application-repository.ts`:
```ts
import type { Application, ApplicationRepository } from './application-repository'

export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly store = new Map<string, Application>()

  async saveApplication(app: Application): Promise<void> {
    this.store.set(app.id, app)
  }
  async getApplicationById(id: string): Promise<Application | null> {
    return this.store.get(id) ?? null
  }
  async listApplicationsByBrief(briefId: string): Promise<Application[]> {
    return [...this.store.values()].filter((a) => a.briefId === briefId)
  }
  async findApplication(briefId: string, creatorId: string): Promise<Application | null> {
    return [...this.store.values()].find((a) => a.briefId === briefId && a.creatorId === creatorId) ?? null
  }
}
```

- [ ] **Step 4: Run to verify it passes** → (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/repository/application-repository.ts src/lib/repository/in-memory-application-repository.ts src/lib/repository/in-memory-application-repository.test.ts
git commit -m "feat: add application repository interface and in-memory impl"
```

---

## Task 4: applyToBrief use-case

**Files:** Create `src/lib/services/apply-to-brief.ts` · Test `src/lib/services/apply-to-brief.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/services/apply-to-brief.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { applyToBrief } from './apply-to-brief'
import { InMemoryApplicationRepository } from '../repository/in-memory-application-repository'
import { InMemoryBriefRepository } from '../repository/in-memory-brief-repository'
import type { Brief } from '../repository/brief-repository'

function openBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    id: 'brief_1', brandId: 'brand_1', title: 'T', goal: 'g',
    budgetMin: 8000, budgetMax: 25000, currency: 'INR', niche: 'beauty', region: 'IN',
    deliverables: ['1 reel'], status: 'open', createdAt: 't', ...overrides,
  }
}

const deps = (brief: Brief) => {
  const briefRepo = new InMemoryBriefRepository()
  briefRepo.saveBrief(brief)
  return { appRepo: new InMemoryApplicationRepository(), briefRepo, idGen: () => 'app_abc', now: () => 't0' }
}

describe('applyToBrief', () => {
  it('creates an application inheriting the brief currency', async () => {
    const d = deps(openBrief())
    const app = await applyToBrief('creator_1', 'brief_1', { quoteAmount: 18000, message: 'hi' }, d)
    expect(app.id).toBe('app_abc')
    expect(app.currency).toBe('INR')
    expect(app.status).toBe('applied')
    expect((await d.appRepo.getApplicationById('app_abc'))?.creatorId).toBe('creator_1')
  })
  it('rejects a second application from the same creator', async () => {
    const d = deps(openBrief())
    await applyToBrief('creator_1', 'brief_1', { quoteAmount: 18000, message: 'hi' }, d)
    await expect(applyToBrief('creator_1', 'brief_1', { quoteAmount: 9000, message: 'again' }, d)).rejects.toThrow()
  })
  it('rejects applying to a non-open brief', async () => {
    const d = deps(openBrief({ status: 'filled' }))
    await expect(applyToBrief('creator_1', 'brief_1', { quoteAmount: 18000, message: 'hi' }, d)).rejects.toThrow()
  })
  it('throws on invalid input', async () => {
    const d = deps(openBrief())
    await expect(applyToBrief('creator_1', 'brief_1', { quoteAmount: 0, message: '' }, d)).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Implement** — create `src/lib/services/apply-to-brief.ts`:
```ts
import { nanoid } from 'nanoid'
import { ApplicationInputSchema } from '../domain/types'
import type { Application, ApplicationRepository } from '../repository/application-repository'
import type { BriefRepository } from '../repository/brief-repository'
import type { IdGenerator } from '../repository/slug'
import type { Clock } from './log-deal'

export interface ApplyDeps {
  appRepo: ApplicationRepository
  briefRepo: BriefRepository
  idGen?: IdGenerator
  now?: Clock
}

export async function applyToBrief(
  creatorId: string,
  briefId: string,
  body: unknown,
  deps: ApplyDeps,
): Promise<Application> {
  if (!creatorId) throw new Error('creatorId is required')
  const input = ApplicationInputSchema.parse(body)

  const brief = await deps.briefRepo.getBriefById(briefId)
  if (!brief || brief.status !== 'open') throw new Error('brief is not open')

  const existing = await deps.appRepo.findApplication(briefId, creatorId)
  if (existing) throw new Error('already applied to this brief')

  const idGen = deps.idGen ?? (() => nanoid())
  const now = deps.now ?? (() => new Date().toISOString())
  const app: Application = {
    ...input,
    id: idGen(),
    briefId,
    creatorId,
    currency: brief.currency,
    status: 'applied',
    createdAt: now(),
  }
  await deps.appRepo.saveApplication(app)
  return app
}
```

- [ ] **Step 4: Run to verify it passes** → (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/services/apply-to-brief.ts src/lib/services/apply-to-brief.test.ts
git commit -m "feat: add applyToBrief use-case"
```

---

## Task 5: acceptApplication use-case (creates a Deal)

**Files:** Create `src/lib/services/accept-application.ts` · Test `src/lib/services/accept-application.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/services/accept-application.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { acceptApplication } from './accept-application'
import { InMemoryApplicationRepository } from '../repository/in-memory-application-repository'
import { InMemoryBriefRepository } from '../repository/in-memory-brief-repository'
import { InMemoryDealRepository } from '../repository/in-memory-deal-repository'
import { InMemoryEventSink } from '../events/in-memory-event-sink'
import type { Brief } from '../repository/brief-repository'
import type { Application } from '../repository/application-repository'

function setup() {
  const appRepo = new InMemoryApplicationRepository()
  const briefRepo = new InMemoryBriefRepository()
  const dealRepo = new InMemoryDealRepository()
  const events = new InMemoryEventSink()
  const brief: Brief = {
    id: 'brief_1', brandId: 'brand_1', title: 'Launch', goal: 'g',
    budgetMin: 8000, budgetMax: 25000, currency: 'INR', niche: 'beauty', region: 'IN',
    deliverables: ['1 reel', '2 stories'], status: 'open', createdAt: 't',
  }
  const app: Application = {
    id: 'app_1', briefId: 'brief_1', creatorId: 'creator_1', quoteAmount: 18000,
    currency: 'INR', message: 'hi', status: 'applied', createdAt: 't',
  }
  briefRepo.saveBrief(brief)
  appRepo.saveApplication(app)
  return { appRepo, briefRepo, dealRepo, events, idGen: () => 'deal_abc', now: () => 't1' }
}

describe('acceptApplication', () => {
  it('mints a deal, marks the application accepted, and fills the brief', async () => {
    const d = setup()
    const deal = await acceptApplication('brand_1', 'app_1', 'Sugar Cosmetics', d)
    expect(deal.id).toBe('deal_abc')
    expect(deal.creatorId).toBe('creator_1')
    expect(deal.brandName).toBe('Sugar Cosmetics')
    expect(deal.amount).toBe(18000)
    expect(deal.deliverables).toEqual(['1 reel', '2 stories'])
    expect(deal.status).toBe('accepted')
    expect((await d.appRepo.getApplicationById('app_1'))?.status).toBe('accepted')
    expect((await d.briefRepo.getBriefById('brief_1'))?.status).toBe('filled')
  })
  it('refuses to accept an application on a brief the brand does not own', async () => {
    const d = setup()
    await expect(acceptApplication('other_brand', 'app_1', 'X', d)).rejects.toThrow()
  })
  it('throws on an unknown application', async () => {
    const d = setup()
    await expect(acceptApplication('brand_1', 'missing', 'X', d)).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Implement** — create `src/lib/services/accept-application.ts`:
```ts
import { nanoid } from 'nanoid'
import type { ApplicationRepository } from '../repository/application-repository'
import type { BriefRepository } from '../repository/brief-repository'
import type { Deal, DealRepository } from '../repository/deal-repository'
import type { EventSink } from '../events/event-sink'
import type { IdGenerator } from '../repository/slug'
import type { Clock } from './log-deal'

export interface AcceptDeps {
  appRepo: ApplicationRepository
  briefRepo: BriefRepository
  dealRepo: DealRepository
  events?: EventSink
  idGen?: IdGenerator
  now?: Clock
}

export async function acceptApplication(
  brandId: string,
  applicationId: string,
  brandName: string,
  deps: AcceptDeps,
): Promise<Deal> {
  const app = await deps.appRepo.getApplicationById(applicationId)
  if (!app) throw new Error(`application not found: ${applicationId}`)

  const brief = await deps.briefRepo.getBriefById(app.briefId)
  if (!brief || brief.brandId !== brandId) throw new Error('not your brief')

  const idGen = deps.idGen ?? (() => nanoid())
  const now = deps.now ?? (() => new Date().toISOString())

  const deal: Deal = {
    id: idGen(),
    creatorId: app.creatorId,
    brandName,
    deliverables: brief.deliverables,
    amount: app.quoteAmount,
    currency: app.currency,
    status: 'accepted',
    offeredAt: now(),
    paidAt: null,
  }
  await deps.dealRepo.saveDeal(deal)
  await deps.appRepo.saveApplication({ ...app, status: 'accepted' })
  await deps.briefRepo.saveBrief({ ...brief, status: 'filled' })
  await deps.events?.record({
    creatorId: app.creatorId,
    type: 'application_accepted',
    payload: { dealId: deal.id, briefId: brief.id, applicationId },
    createdAt: now(),
  })
  return deal
}
```

- [ ] **Step 4: Run to verify it passes** → (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/services/accept-application.ts src/lib/services/accept-application.test.ts
git commit -m "feat: add acceptApplication use-case"
```

---

## Task 6: Migration + Supabase application repository + deps wiring

**Files:** Create `supabase/migrations/0009_applications.sql`, `src/lib/repository/supabase-application-repository.ts` · Modify `src/lib/server/deps.ts`

No unit test (network). Do NOT apply the migration (the controller applies it). Verify with `tsc`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0009_applications.sql`:
```sql
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

-- Creator owns her applications.
drop policy if exists applications_creator_all on public.applications;
create policy applications_creator_all on public.applications
  for all to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Brand can read applications on briefs it owns.
drop policy if exists applications_brand_read on public.applications;
create policy applications_brand_read on public.applications
  for select to authenticated
  using (exists (
    select 1 from public.briefs b
    where b.id = applications.brief_id and b.brand_id = auth.uid()
  ));
```

- [ ] **Step 2: Implement the Supabase repository** — create `src/lib/repository/supabase-application-repository.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ApplicationStatus, Currency } from '../domain/types'
import type { Application, ApplicationRepository } from './application-repository'

interface AppRow {
  id: string
  brief_id: string
  creator_id: string
  quote_amount: number | string
  currency: string
  message: string
  status: string
  created_at: string
}

function toApp(row: AppRow): Application {
  return {
    id: row.id,
    briefId: row.brief_id,
    creatorId: row.creator_id,
    quoteAmount: Number(row.quote_amount),
    currency: row.currency as Currency,
    message: row.message,
    status: row.status as ApplicationStatus,
    createdAt: row.created_at,
  }
}

export class SupabaseApplicationRepository implements ApplicationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveApplication(app: Application): Promise<void> {
    const { error } = await this.client.from('applications').upsert({
      id: app.id,
      brief_id: app.briefId,
      creator_id: app.creatorId,
      quote_amount: app.quoteAmount,
      currency: app.currency,
      message: app.message,
      status: app.status,
      created_at: app.createdAt,
    })
    if (error) throw new Error(`saveApplication failed: ${error.message}`)
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const { data, error } = await this.client.from('applications').select('*').eq('id', id).maybeSingle<AppRow>()
    if (error) throw new Error(`getApplicationById failed: ${error.message}`)
    return data ? toApp(data) : null
  }

  async listApplicationsByBrief(briefId: string): Promise<Application[]> {
    const { data, error } = await this.client
      .from('applications').select('*').eq('brief_id', briefId)
      .order('created_at', { ascending: true }).returns<AppRow[]>()
    if (error) throw new Error(`listApplicationsByBrief failed: ${error.message}`)
    return (data ?? []).map(toApp)
  }

  async findApplication(briefId: string, creatorId: string): Promise<Application | null> {
    const { data, error } = await this.client
      .from('applications').select('*').eq('brief_id', briefId).eq('creator_id', creatorId)
      .maybeSingle<AppRow>()
    if (error) throw new Error(`findApplication failed: ${error.message}`)
    return data ? toApp(data) : null
  }
}
```

- [ ] **Step 3: Wire into deps** — in `src/lib/server/deps.ts`: import `SupabaseApplicationRepository` and the `ApplicationRepository` type; add `appRepo: ApplicationRepository` to `ServerDeps`; add `appRepo: new SupabaseApplicationRepository(client),` to `getServerDeps()`.

- [ ] **Step 4: Verify** — `pnpm tsc --noEmit` (no errors). Do not apply the migration.

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/0009_applications.sql src/lib/repository/supabase-application-repository.ts src/lib/server/deps.ts
git commit -m "feat: add applications migration, supabase repo, and deps wiring"
```

---

## Task 7: Profile + application API routes

**Files:** Create `src/app/api/profile/route.ts`, `src/app/api/briefs/[id]/apply/route.ts`, `src/app/api/briefs/[id]/applications/route.ts`, `src/app/api/applications/[id]/accept/route.ts` · Test `src/app/api/profile/route.test.ts`

- [ ] **Step 1: Write the failing test** (covers the profile route contract)

Create `src/app/api/profile/route.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'

const updated: Record<string, unknown>[] = []
vi.mock('../../../lib/auth/server', () => ({
  getUserIdFromRequest: async (req: Request) =>
    req.headers.get('authorization') === 'Bearer creator' ? 'creator_1' : null,
}))
vi.mock('../../../lib/supabase/server-client', () => ({
  createServiceClient: () => ({
    from: () => ({ update: (vals: Record<string, unknown>) => ({ eq: async () => { updated.push(vals); return { error: null } } }) }),
  }),
}))

import { POST } from './route'

function req(auth: string | null, body: unknown): Request {
  return new Request('http://localhost/api/profile', {
    method: 'POST',
    headers: auth ? { authorization: auth, 'content-type': 'application/json' } : {},
    body: JSON.stringify(body),
  })
}

const valid = { niche: 'beauty', region: 'IN', rateFloor: 12000 }

describe('POST /api/profile', () => {
  it('returns 200 and updates the creator row', async () => {
    const res = await POST(req('Bearer creator', valid))
    expect(res.status).toBe(200)
    expect(updated.at(-1)).toMatchObject({ niche: 'beauty', region: 'IN', rate_floor: 12000 })
  })
  it('returns 401 without auth', async () => {
    expect((await POST(req(null, valid))).status).toBe(401)
  })
  it('returns 400 for invalid input', async () => {
    expect((await POST(req('Bearer creator', { niche: 'x' }))).status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Implement the four routes**

`src/app/api/profile/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { CreatorProfileSchema } from '../../../lib/domain/types'
import { getUserIdFromRequest } from '../../../lib/auth/server'
import { createServiceClient } from '../../../lib/supabase/server-client'

export async function POST(request: Request): Promise<Response> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  try {
    const profile = CreatorProfileSchema.parse(body)
    const { error } = await createServiceClient()
      .from('creators')
      .update({ niche: profile.niche, region: profile.region, rate_floor: profile.rateFloor })
      .eq('id', userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues.map((i) => ({ path: i.path, message: i.message })) }, { status: 400 })
    }
    console.error('update profile failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

`src/app/api/briefs/[id]/apply/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getUserIdFromRequest } from '../../../../../lib/auth/server'
import { getServerDeps } from '../../../../../lib/server/deps'
import { applyToBrief } from '../../../../../lib/services/apply-to-brief'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  try {
    const deps = getServerDeps()
    const app = await applyToBrief(userId, id, body, { appRepo: deps.appRepo, briefRepo: deps.briefRepo })
    return NextResponse.json(app, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues.map((i) => ({ path: i.path, message: i.message })) }, { status: 400 })
    }
    return NextResponse.json({ error: (error as Error).message || 'Could not apply' }, { status: 400 })
  }
}
```

`src/app/api/briefs/[id]/applications/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../../lib/auth/server'
import { getServerDeps } from '../../../../../lib/server/deps'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const deps = getServerDeps()
    const brief = await deps.briefRepo.getBriefById(id)
    if (!brief || brief.brandId !== userId) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
    }
    const applications = await deps.appRepo.listApplicationsByBrief(id)
    return NextResponse.json({ applications }, { status: 200 })
  } catch (error) {
    console.error('list applications failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

`src/app/api/applications/[id]/accept/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../../lib/auth/server'
import { getServerDeps } from '../../../../../lib/server/deps'
import { createServiceClient } from '../../../../../lib/supabase/server-client'
import { acceptApplication } from '../../../../../lib/services/accept-application'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const { data: brand } = await createServiceClient()
      .from('brands').select('name').eq('id', userId).maybeSingle<{ name: string }>()
    if (!brand) return NextResponse.json({ error: 'Not a brand account' }, { status: 403 })

    const deps = getServerDeps()
    const deal = await acceptApplication(userId, id, brand.name, {
      appRepo: deps.appRepo, briefRepo: deps.briefRepo, dealRepo: deps.dealRepo, events: deps.events,
    })
    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Could not accept' }, { status: 400 })
  }
}
```

- [ ] **Step 4: Run to verify it passes** → `pnpm vitest run src/app/api/profile/route.test.ts` (3 tests). Then `pnpm tsc --noEmit`.

- [ ] **Step 5: Commit**
```bash
git add src/app/api/profile src/app/api/briefs src/app/api/applications
git commit -m "feat: add profile + application API routes"
```

---

## Task 8: UI — profile editor, apply, accept

**Files:** Modify `src/app/dashboard/page.tsx`, `src/app/briefs/page.tsx`, `src/app/brand/page.tsx`. Preserve all existing `data-testid`s and field names.

- [ ] **Step 1: Dashboard — add a profile editor**

In `src/app/dashboard/page.tsx`, inside `<main>` after the metrics `<section>` and before the existing two-column grid, add a profile card. Add a handler that POSTs to `/api/profile`:
```tsx
async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  await authFetch('/api/profile', {
    method: 'POST',
    body: JSON.stringify({
      niche: String(form.get('niche')),
      region: String(form.get('region')),
      rateFloor: Number(form.get('rateFloor')),
    }),
  })
}
```
And the markup (reuse `inputClass`):
```tsx
<section className="mt-8 rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft" data-testid="profile-form-wrap">
  <h2 className="font-display text-xl font-semibold text-ink">Your profile</h2>
  <p className="mt-1 text-sm text-ink-soft">Set these so brands can match you with briefs.</p>
  <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-3" data-testid="profile-form">
    <select name="niche" className={inputClass} defaultValue="beauty">
      {['fashion','beauty','fitness','food','lifestyle','tech'].map((n) => (<option key={n} value={n}>{n[0].toUpperCase()+n.slice(1)}</option>))}
    </select>
    <select name="region" className={inputClass} defaultValue="IN">
      <option value="IN">India</option><option value="AE">UAE</option>
    </select>
    <input name="rateFloor" type="number" min={1} required placeholder="Rate floor" className={inputClass} />
    <button type="submit" className="rounded-full bg-ink px-5 py-2.5 font-medium text-paper sm:col-span-3 sm:w-fit">Save profile</button>
  </form>
</section>
```

- [ ] **Step 2: Briefs feed — add an Apply form per brief**

In `src/app/briefs/page.tsx`, keep `data-testid="briefs-feed"`. Track the access token in state (the page currently only loads with it). Add token state and an `apply` handler:
```tsx
const [token, setToken] = useState<string | null>(null)
// in the getSession().then: setToken(data.session.access_token) before load(...)
async function apply(briefId: string, event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const res = await fetch(`/api/briefs/${briefId}/apply`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ quoteAmount: Number(form.get('quoteAmount')), message: String(form.get('message')) }),
  })
  if (res.ok) event.currentTarget.reset()
}
```
Inside each brief `<li>`, after the chips, add a compact apply form (prefilled quote = budgetMin):
```tsx
<form onSubmit={(e) => apply(b.id, e)} className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-4" data-testid="apply-form">
  <input name="quoteAmount" type="number" min={1} required defaultValue={b.budgetMin} className="w-32 rounded-[10px] border border-line bg-paper/60 px-3 py-2 text-sm" />
  <input name="message" required placeholder="One line for the brand" className="min-w-0 flex-1 rounded-[10px] border border-line bg-paper/60 px-3 py-2 text-sm" />
  <button type="submit" className="rounded-full bg-marigold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-marigold-deep hover:text-paper">Apply</button>
</form>
```

- [ ] **Step 3: Brand — view + accept applicants per brief**

In `src/app/brand/page.tsx`, keep `data-testid="brand-briefs"`. Add per-brief applicant loading + accept. Add state `const [apps, setApps] = useState<Record<string, Applicant[]>>({})` with:
```tsx
interface Applicant { id: string; quoteAmount: number; currency: string; message: string; status: string }
async function loadApplicants(briefId: string) {
  const res = await authFetch(`/api/briefs/${briefId}/applications`)
  if (res.ok) setApps((prev) => ({ ...prev, [briefId]: (await res.json()).applications }))
}
async function accept(applicationId: string, briefId: string) {
  const res = await authFetch(`/api/applications/${applicationId}/accept`, { method: 'POST' })
  if (res.ok) await loadApplicants(briefId)
}
```
In each posted-brief `<li>`, add a "View applicants" button (`onClick={() => loadApplicants(b.id)}`) and render `apps[b.id]` as a list with each applicant's quote/message and an "Accept" button (`onClick={() => accept(a.id, b.id)}`), styled with the existing tokens. Add `data-testid="applicants"` to the applicants list.

- [ ] **Step 4: Verify build** — `pnpm build` (clean; routes `/api/profile`, `/api/briefs/[id]/apply`, `/api/briefs/[id]/applications`, `/api/applications/[id]/accept` present).

- [ ] **Step 5: Commit**
```bash
git add src/app/dashboard/page.tsx src/app/briefs/page.tsx src/app/brand/page.tsx
git commit -m "feat: profile editor, apply-to-brief, and accept-applicant UI"
```

---

## Task 9: Full pass + apply migration

- [ ] **Step 1: Whole suite** — `pnpm test` (existing 71 + new ~21 pass).
- [ ] **Step 2: Typecheck + build** — `pnpm tsc --noEmit && pnpm build` (clean).
- [ ] **Step 3: Apply migration** — apply `0009_applications.sql` to the Supabase project; run `get_advisors` (security) → expect no new lints (applications has policies).
- [ ] **Step 4: Manual E2E** (live project) — as a creator, set profile (niche/region/floor); confirm matched briefs show; apply to one. As the posting brand, view applicants and accept; confirm a deal appears in the creator's cockpit with status `accepted` and the brief flips to `filled`.
- [ ] **Step 5: Commit any fixups**
```bash
git add -A && git commit -m "test: phase 2.3 applications full pass"
```

---

## Notes / follow-ups (P2.4)
- Escrow: extend `PaymentsProvider` with `createEscrowFunding`/`releaseEscrow`; a deal `escrow_status` state machine; on accept, optionally require the brand to fund escrow before the creator delivers.
- Deal↔brief linkage: add `brief_id`/`application_id`/`brand_id` columns to `deals` for traceability + brand-side deal views.
- Decline path: let a brand decline other applicants when one is accepted; notify creators.
