# Phase 0 — AI Media-Kit & Rate-Card Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a free web app where a creator enters their Instagram stats and instantly gets a shareable AI-generated media kit with a data-backed rate card, while we capture the rate-card dataset.

**Architecture:** Next.js 16 App Router on Vercel. A pure, fully-tested pricing engine computes engagement rate, tier, and per-deliverable rate bands from creator stats plus an in-code benchmark table. An AI copy generator (Vercel AI Gateway via the AI SDK) writes the media-kit prose. Everything persists to a single Supabase `media_kits` table (flat columns for analytics + jsonb for rich content). A public `/kit/[slug]` page renders the shareable kit.

**Tech Stack:** TypeScript, Next.js 16 (App Router, `src/` dir), Tailwind CSS, Vitest (unit/integration), Playwright (one E2E), Zod (boundary validation), AI SDK (`ai`) through Vercel AI Gateway, Supabase Postgres (`@supabase/supabase-js`), nanoid (slug ids), pnpm.

**Scope note:** This is one sub-project of the Roster venture spec (`docs/superpowers/specs/2026-06-03-roster-ai-collab-rails-design.md`). No payments, no Instagram OAuth, no brand side. Stats are entered manually behind an `InstagramStatsProvider` seam so real Graph API data can drop in during Phase 1.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/domain/types.ts` | Zod schemas + TS types for stats, tiers, niches, regions, rate cards, media-kit copy |
| `src/lib/pricing/engagement.ts` | `computeEngagementRate` (pure) |
| `src/lib/pricing/tier.ts` | `classifyTier` (pure) |
| `src/lib/pricing/benchmarks.ts` | In-code benchmark tables + `getBasePostRate` (pure) |
| `src/lib/pricing/rate-card.ts` | `computeRateCard` orchestrating the above (pure) |
| `src/lib/ai/media-kit-copy.ts` | `generateMediaKitCopy` via AI SDK; injectable for tests |
| `src/lib/repository/kit-repository.ts` | `KitRepository` interface + `KitRecord` type |
| `src/lib/repository/in-memory-kit-repository.ts` | In-memory impl for tests |
| `src/lib/repository/supabase-kit-repository.ts` | Supabase impl for runtime |
| `src/lib/repository/slug.ts` | `makeSlug` (handle + id) |
| `src/lib/services/create-kit.ts` | `createKit` use-case: validate → compute → copy → persist |
| `src/app/api/media-kit/route.ts` | POST endpoint wiring the use-case to HTTP |
| `src/app/create/page.tsx` | Creator input form (client) |
| `src/app/kit/[slug]/page.tsx` | Public shareable media-kit page (server) |
| `src/app/page.tsx` | Landing page with CTA |
| `supabase/migrations/0001_media_kits.sql` | `media_kits` table |
| `e2e/create-kit.spec.ts` | One happy-path E2E |

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `src/app/layout.tsx`, `src/app/globals.css`, `.gitignore`

- [ ] **Step 1: Scaffold Next.js + deps**

Run:
```bash
pnpm dlx create-next-app@latest . --ts --app --src-dir --tailwind --eslint --use-pnpm --no-import-alias --yes
pnpm add ai zod @supabase/supabase-js nanoid
pnpm add -D vitest @vitejs/plugin-react jsdom @playwright/test
```

- [ ] **Step 2: Add Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: { provider: 'v8', reportsDirectory: './coverage' },
  },
})
```

- [ ] **Step 3: Add test script**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test"
```

- [ ] **Step 4: Create `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-me
# Vercel AI Gateway (omit locally to use OIDC on Vercel)
AI_GATEWAY_API_KEY=replace-me
```

- [ ] **Step 5: Verify it builds**

Run: `pnpm build`
Expected: build completes with no type errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js media-kit app with vitest"
```

---

## Task 2: Domain types and schemas

**Files:**
- Create: `src/lib/domain/types.ts`
- Test: `src/lib/domain/types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/domain/types.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { CreatorStatsSchema } from './types'

describe('CreatorStatsSchema', () => {
  it('accepts a valid creator stats payload', () => {
    const parsed = CreatorStatsSchema.parse({
      handle: 'aanya.styles',
      displayName: 'Aanya',
      email: 'aanya@example.com',
      niche: 'fashion',
      region: 'IN',
      followerCount: 50000,
      avgLikes: 1400,
      avgComments: 100,
    })
    expect(parsed.niche).toBe('fashion')
  })

  it('rejects zero followers', () => {
    expect(() =>
      CreatorStatsSchema.parse({
        handle: 'x',
        displayName: 'X',
        email: 'x@example.com',
        niche: 'beauty',
        region: 'AE',
        followerCount: 0,
        avgLikes: 0,
        avgComments: 0,
      }),
    ).toThrow()
  })

  it('rejects an unknown niche', () => {
    expect(() =>
      CreatorStatsSchema.parse({
        handle: 'x',
        displayName: 'X',
        email: 'x@example.com',
        niche: 'crypto',
        region: 'IN',
        followerCount: 5000,
        avgLikes: 100,
        avgComments: 5,
      }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/domain/types.test.ts`
Expected: FAIL with "Cannot find module './types'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/domain/types.ts`:
```ts
import { z } from 'zod'

export const NICHES = ['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'] as const
export const REGIONS = ['IN', 'AE'] as const
export const TIERS = ['nano', 'micro', 'mid', 'macro'] as const

export type Niche = (typeof NICHES)[number]
export type Region = (typeof REGIONS)[number]
export type Tier = (typeof TIERS)[number]

export const CreatorStatsSchema = z.object({
  handle: z.string().min(1).max(60),
  displayName: z.string().min(1).max(80),
  email: z.string().email(),
  niche: z.enum(NICHES),
  region: z.enum(REGIONS),
  followerCount: z.number().int().positive(),
  avgLikes: z.number().int().nonnegative(),
  avgComments: z.number().int().nonnegative(),
})
export type CreatorStats = z.infer<typeof CreatorStatsSchema>

export interface Band {
  min: number
  max: number
}

export interface RateCard {
  currency: 'INR' | 'AED'
  reel: Band
  story: Band
  carousel: Band
  bundle: Band
}

export interface MediaKitCopy {
  headline: string
  bio: string
  audienceSummary: string
  brandFitCategories: string[]
  highlights: string[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/domain/types.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain
git commit -m "feat: add domain types and creator-stats schema"
```

---

## Task 3: Engagement rate (pure)

**Files:**
- Create: `src/lib/pricing/engagement.ts`
- Test: `src/lib/pricing/engagement.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pricing/engagement.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { computeEngagementRate } from './engagement'

describe('computeEngagementRate', () => {
  it('returns (likes+comments)/followers as a percentage, 2dp', () => {
    expect(computeEngagementRate(50000, 1400, 100)).toBe(3.0)
  })

  it('rounds to two decimals', () => {
    expect(computeEngagementRate(8000, 600, 40)).toBe(8.0)
    expect(computeEngagementRate(3333, 100, 0)).toBe(3.0)
  })

  it('throws on non-positive followers', () => {
    expect(() => computeEngagementRate(0, 10, 1)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pricing/engagement.test.ts`
Expected: FAIL with "Cannot find module './engagement'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/pricing/engagement.ts`:
```ts
export function computeEngagementRate(
  followerCount: number,
  avgLikes: number,
  avgComments: number,
): number {
  if (followerCount <= 0) {
    throw new Error('followerCount must be positive')
  }
  const rate = ((avgLikes + avgComments) / followerCount) * 100
  return Math.round(rate * 100) / 100
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/pricing/engagement.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing/engagement.ts src/lib/pricing/engagement.test.ts
git commit -m "feat: add engagement-rate calculation"
```

---

## Task 4: Tier classification (pure)

**Files:**
- Create: `src/lib/pricing/tier.ts`
- Test: `src/lib/pricing/tier.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pricing/tier.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { classifyTier } from './tier'

describe('classifyTier', () => {
  it('classifies boundaries correctly', () => {
    expect(classifyTier(9999)).toBe('nano')
    expect(classifyTier(10000)).toBe('micro')
    expect(classifyTier(99999)).toBe('micro')
    expect(classifyTier(100000)).toBe('mid')
    expect(classifyTier(499999)).toBe('mid')
    expect(classifyTier(500000)).toBe('macro')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pricing/tier.test.ts`
Expected: FAIL with "Cannot find module './tier'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/pricing/tier.ts`:
```ts
import type { Tier } from '../domain/types'

export function classifyTier(followerCount: number): Tier {
  if (followerCount < 10000) return 'nano'
  if (followerCount < 100000) return 'micro'
  if (followerCount < 500000) return 'mid'
  return 'macro'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/pricing/tier.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing/tier.ts src/lib/pricing/tier.test.ts
git commit -m "feat: add follower-tier classification"
```

---

## Task 5: Benchmark table + base post rate (pure)

**Files:**
- Create: `src/lib/pricing/benchmarks.ts`
- Test: `src/lib/pricing/benchmarks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pricing/benchmarks.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { getBasePostRate, currencyForRegion } from './benchmarks'

describe('benchmarks', () => {
  it('maps region to currency', () => {
    expect(currencyForRegion('IN')).toBe('INR')
    expect(currencyForRegion('AE')).toBe('AED')
  })

  it('returns base post rate = regionTierBase * nicheFactor', () => {
    // IN micro base 9000 * fashion 1.0
    expect(getBasePostRate('IN', 'fashion', 'micro')).toBe(9000)
    // IN micro base 9000 * beauty 1.1
    expect(getBasePostRate('IN', 'beauty', 'micro')).toBe(9900)
    // AE nano base 150 * beauty 1.1
    expect(getBasePostRate('AE', 'beauty', 'nano')).toBe(165)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pricing/benchmarks.test.ts`
Expected: FAIL with "Cannot find module './benchmarks'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/pricing/benchmarks.ts`:
```ts
import type { Niche, Region, Tier } from '../domain/types'

// Base single in-feed post rate in local currency, by region and tier.
const REGION_TIER_BASE: Record<Region, Record<Tier, number>> = {
  IN: { nano: 1500, micro: 9000, mid: 45000, macro: 150000 },
  AE: { nano: 150, micro: 700, mid: 3000, macro: 9000 },
}

const NICHE_FACTOR: Record<Niche, number> = {
  fashion: 1.0,
  beauty: 1.1,
  fitness: 0.9,
  food: 0.85,
  lifestyle: 0.95,
  tech: 1.2,
}

// Typical engagement % per tier, used as the multiplier baseline.
export const TYPICAL_ENGAGEMENT: Record<Tier, number> = {
  nano: 4.0,
  micro: 2.0,
  mid: 1.4,
  macro: 1.0,
}

export function currencyForRegion(region: Region): 'INR' | 'AED' {
  return region === 'IN' ? 'INR' : 'AED'
}

export function getBasePostRate(region: Region, niche: Niche, tier: Tier): number {
  return REGION_TIER_BASE[region][tier] * NICHE_FACTOR[niche]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/pricing/benchmarks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing/benchmarks.ts src/lib/pricing/benchmarks.test.ts
git commit -m "feat: add rate benchmark table and base post rate"
```

---

## Task 6: Rate card engine (pure)

**Files:**
- Create: `src/lib/pricing/rate-card.ts`
- Test: `src/lib/pricing/rate-card.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pricing/rate-card.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { computeRateCard } from './rate-card'
import type { CreatorStats } from '../domain/types'

const inMicroFashion: CreatorStats = {
  handle: 'aanya.styles',
  displayName: 'Aanya',
  email: 'aanya@example.com',
  niche: 'fashion',
  region: 'IN',
  followerCount: 50000,
  avgLikes: 1400,
  avgComments: 100,
}

const aeNanoBeauty: CreatorStats = {
  handle: 'layla.glow',
  displayName: 'Layla',
  email: 'layla@example.com',
  niche: 'beauty',
  region: 'AE',
  followerCount: 8000,
  avgLikes: 600,
  avgComments: 40,
}

describe('computeRateCard', () => {
  it('computes INR bands for a micro fashion creator (ER 3.0%, x1.5)', () => {
    const card = computeRateCard(inMicroFashion)
    expect(card.currency).toBe('INR')
    expect(card.reel).toEqual({ min: 14000, max: 21100 })
    expect(card.story).toEqual({ min: 4300, max: 6500 })
    expect(card.carousel).toEqual({ min: 10800, max: 16200 })
    expect(card.bundle).toEqual({ min: 24300, max: 36500 })
  })

  it('computes AED bands for a nano beauty creator (ER 8.0%, x2.0 clamp)', () => {
    const card = computeRateCard(aeNanoBeauty)
    expect(card.currency).toBe('AED')
    expect(card.reel).toEqual({ min: 350, max: 525 })
    expect(card.story).toEqual({ min: 100, max: 150 })
    expect(card.carousel).toEqual({ min: 275, max: 400 })
    expect(card.bundle).toEqual({ min: 600, max: 900 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pricing/rate-card.test.ts`
Expected: FAIL with "Cannot find module './rate-card'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/pricing/rate-card.ts`:
```ts
import type { Band, CreatorStats, RateCard } from '../domain/types'
import { computeEngagementRate } from './engagement'
import { classifyTier } from './tier'
import { currencyForRegion, getBasePostRate, TYPICAL_ENGAGEMENT } from './benchmarks'

const DELIVERABLE = { reel: 1.3, carousel: 1.0, story: 0.4 } as const
const BAND_SPREAD = 0.2
const ENGAGEMENT_MULTIPLIER_MIN = 0.6
const ENGAGEMENT_MULTIPLIER_MAX = 2.0
const BUNDLE_DISCOUNT = 0.9

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function bandFromPoint(point: number, step: number): Band {
  const round = (v: number) => Math.round(v / step) * step
  return {
    min: round(point * (1 - BAND_SPREAD)),
    max: round(point * (1 + BAND_SPREAD)),
  }
}

export function computeRateCard(stats: CreatorStats): RateCard {
  const engagementRate = computeEngagementRate(
    stats.followerCount,
    stats.avgLikes,
    stats.avgComments,
  )
  const tier = classifyTier(stats.followerCount)
  const base = getBasePostRate(stats.region, stats.niche, tier)

  const multiplier = clamp(
    engagementRate / TYPICAL_ENGAGEMENT[tier],
    ENGAGEMENT_MULTIPLIER_MIN,
    ENGAGEMENT_MULTIPLIER_MAX,
  )
  const adjustedBase = base * multiplier

  const reelPoint = adjustedBase * DELIVERABLE.reel
  const storyPoint = adjustedBase * DELIVERABLE.story
  const carouselPoint = adjustedBase * DELIVERABLE.carousel
  const bundlePoint = (reelPoint + 3 * storyPoint) * BUNDLE_DISCOUNT

  const currency = currencyForRegion(stats.region)
  const step = currency === 'INR' ? 100 : 25

  return {
    currency,
    reel: bandFromPoint(reelPoint, step),
    story: bandFromPoint(storyPoint, step),
    carousel: bandFromPoint(carouselPoint, step),
    bundle: bandFromPoint(bundlePoint, step),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/pricing/rate-card.test.ts`
Expected: PASS (2 tests). If a band is off, recheck `step` and `BAND_SPREAD` math against the test comments.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing/rate-card.ts src/lib/pricing/rate-card.test.ts
git commit -m "feat: add rate-card engine with engagement-adjusted bands"
```

---

## Task 7: Slug generation

**Files:**
- Create: `src/lib/repository/slug.ts`
- Test: `src/lib/repository/slug.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/repository/slug.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { makeSlug } from './slug'

describe('makeSlug', () => {
  it('slugifies the handle and appends the id', () => {
    expect(makeSlug('Aanya.Styles', () => 'abc123')).toBe('aanya-styles-abc123')
  })

  it('strips unsafe characters', () => {
    expect(makeSlug('layla glow!! ✨', () => 'xyz789')).toBe('layla-glow-xyz789')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/repository/slug.test.ts`
Expected: FAIL with "Cannot find module './slug'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/repository/slug.ts`:
```ts
import { nanoid } from 'nanoid'

export type IdGenerator = () => string

export function makeSlug(handle: string, idGen: IdGenerator = () => nanoid(6)): string {
  const base = handle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base}-${idGen()}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/repository/slug.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/repository/slug.ts src/lib/repository/slug.test.ts
git commit -m "feat: add slug generation"
```

---

## Task 8: Repository interface + in-memory implementation

**Files:**
- Create: `src/lib/repository/kit-repository.ts`
- Create: `src/lib/repository/in-memory-kit-repository.ts`
- Test: `src/lib/repository/in-memory-kit-repository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/repository/in-memory-kit-repository.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { InMemoryKitRepository } from './in-memory-kit-repository'
import type { KitRecord } from './kit-repository'

const record: KitRecord = {
  slug: 'aanya-styles-abc123',
  stats: {
    handle: 'aanya.styles',
    displayName: 'Aanya',
    email: 'aanya@example.com',
    niche: 'fashion',
    region: 'IN',
    followerCount: 50000,
    avgLikes: 1400,
    avgComments: 100,
  },
  engagementRate: 3.0,
  tier: 'micro',
  rateCard: {
    currency: 'INR',
    reel: { min: 14000, max: 21100 },
    story: { min: 4300, max: 6500 },
    carousel: { min: 10800, max: 16200 },
    bundle: { min: 24300, max: 36500 },
  },
  copy: {
    headline: 'Fashion creator',
    bio: 'bio',
    audienceSummary: 'audience',
    brandFitCategories: ['fashion'],
    highlights: ['highlight'],
  },
}

describe('InMemoryKitRepository', () => {
  it('saves and retrieves by slug', async () => {
    const repo = new InMemoryKitRepository()
    await repo.saveKit(record)
    const found = await repo.getKitBySlug('aanya-styles-abc123')
    expect(found?.stats.handle).toBe('aanya.styles')
  })

  it('returns null for an unknown slug', async () => {
    const repo = new InMemoryKitRepository()
    expect(await repo.getKitBySlug('missing')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/repository/in-memory-kit-repository.test.ts`
Expected: FAIL with "Cannot find module './in-memory-kit-repository'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/repository/kit-repository.ts`:
```ts
import type { CreatorStats, MediaKitCopy, RateCard, Tier } from '../domain/types'

export interface KitRecord {
  slug: string
  stats: CreatorStats
  engagementRate: number
  tier: Tier
  rateCard: RateCard
  copy: MediaKitCopy
}

export interface KitRepository {
  saveKit(record: KitRecord): Promise<void>
  getKitBySlug(slug: string): Promise<KitRecord | null>
}
```

Create `src/lib/repository/in-memory-kit-repository.ts`:
```ts
import type { KitRecord, KitRepository } from './kit-repository'

export class InMemoryKitRepository implements KitRepository {
  private readonly store = new Map<string, KitRecord>()

  async saveKit(record: KitRecord): Promise<void> {
    this.store.set(record.slug, record)
  }

  async getKitBySlug(slug: string): Promise<KitRecord | null> {
    return this.store.get(slug) ?? null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/repository/in-memory-kit-repository.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/repository/kit-repository.ts src/lib/repository/in-memory-kit-repository.ts src/lib/repository/in-memory-kit-repository.test.ts
git commit -m "feat: add kit repository interface and in-memory impl"
```

---

## Task 9: AI media-kit copy generator (injectable)

**Files:**
- Create: `src/lib/ai/media-kit-copy.ts`
- Test: `src/lib/ai/media-kit-copy.test.ts`

The real generator calls the AI SDK. The use-case accepts a `CopyGenerator` function so tests inject a deterministic fake. This task ships the type + the real generator; the fake lives in the test.

- [ ] **Step 1: Write the failing test**

Create `src/lib/ai/media-kit-copy.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { MediaKitCopySchema } from './media-kit-copy'

describe('MediaKitCopySchema', () => {
  it('validates a well-formed copy object', () => {
    const parsed = MediaKitCopySchema.parse({
      headline: 'Mumbai fashion & thrift creator',
      bio: 'I style affordable outfits for college students.',
      audienceSummary: '70% women, 18-27, India metros.',
      brandFitCategories: ['fashion', 'thrift', 'accessories'],
      highlights: ['Avg 3% engagement', 'Strong reels reach'],
    })
    expect(parsed.brandFitCategories.length).toBe(3)
  })

  it('rejects empty headline', () => {
    expect(() =>
      MediaKitCopySchema.parse({
        headline: '',
        bio: 'x',
        audienceSummary: 'x',
        brandFitCategories: ['fashion'],
        highlights: ['x'],
      }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/ai/media-kit-copy.test.ts`
Expected: FAIL with "Cannot find module './media-kit-copy'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/ai/media-kit-copy.ts`:
```ts
import { generateObject } from 'ai'
import { z } from 'zod'
import type { CreatorStats, MediaKitCopy, Tier } from '../domain/types'

export const MediaKitCopySchema = z.object({
  headline: z.string().min(1).max(120),
  bio: z.string().min(1).max(400),
  audienceSummary: z.string().min(1).max(300),
  brandFitCategories: z.array(z.string().min(1)).min(1).max(8),
  highlights: z.array(z.string().min(1)).min(1).max(6),
})

export interface CopyInput extends CreatorStats {
  engagementRate: number
  tier: Tier
}

export type CopyGenerator = (input: CopyInput) => Promise<MediaKitCopy>

// Default model goes through the Vercel AI Gateway.
const MODEL = process.env.MEDIA_KIT_MODEL ?? 'anthropic/claude-haiku-4.5'

export const generateMediaKitCopy: CopyGenerator = async (input) => {
  const { object } = await generateObject({
    model: MODEL,
    schema: MediaKitCopySchema,
    prompt: [
      'Write a concise, professional influencer media-kit for a brand audience.',
      `Handle: @${input.handle}`,
      `Name: ${input.displayName}`,
      `Niche: ${input.niche}. Region: ${input.region}. Tier: ${input.tier}.`,
      `Followers: ${input.followerCount}. Engagement rate: ${input.engagementRate}%.`,
      'Keep claims grounded in these numbers. No emojis in the bio.',
    ].join('\n'),
  })
  return object
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/ai/media-kit-copy.test.ts`
Expected: PASS. (The schema is tested; the network call is not invoked here.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/media-kit-copy.ts src/lib/ai/media-kit-copy.test.ts
git commit -m "feat: add AI media-kit copy generator and schema"
```

---

## Task 10: Create-kit use-case (orchestration)

**Files:**
- Create: `src/lib/services/create-kit.ts`
- Test: `src/lib/services/create-kit.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/services/create-kit.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { createKit } from './create-kit'
import { InMemoryKitRepository } from '../repository/in-memory-kit-repository'
import type { CopyGenerator } from '../ai/media-kit-copy'

const fakeCopy: CopyGenerator = async (input) => ({
  headline: `${input.niche} creator`,
  bio: 'bio',
  audienceSummary: 'audience',
  brandFitCategories: [input.niche],
  highlights: [`ER ${input.engagementRate}%`],
})

const validBody = {
  handle: 'aanya.styles',
  displayName: 'Aanya',
  email: 'aanya@example.com',
  niche: 'fashion',
  region: 'IN',
  followerCount: 50000,
  avgLikes: 1400,
  avgComments: 100,
}

describe('createKit', () => {
  it('computes, generates copy, persists, and returns a slug', async () => {
    const repo = new InMemoryKitRepository()
    const result = await createKit(validBody, {
      repo,
      generateCopy: fakeCopy,
      idGen: () => 'abc123',
    })
    expect(result.slug).toBe('aanya-styles-abc123')

    const saved = await repo.getKitBySlug('aanya-styles-abc123')
    expect(saved?.engagementRate).toBe(3.0)
    expect(saved?.tier).toBe('micro')
    expect(saved?.rateCard.reel).toEqual({ min: 14000, max: 21100 })
    expect(saved?.copy.headline).toBe('fashion creator')
  })

  it('throws a validation error on a bad body', async () => {
    const repo = new InMemoryKitRepository()
    await expect(
      createKit({ ...validBody, followerCount: 0 }, {
        repo,
        generateCopy: fakeCopy,
        idGen: () => 'abc123',
      }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/services/create-kit.test.ts`
Expected: FAIL with "Cannot find module './create-kit'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/services/create-kit.ts`:
```ts
import { CreatorStatsSchema } from '../domain/types'
import { computeEngagementRate } from '../pricing/engagement'
import { classifyTier } from '../pricing/tier'
import { computeRateCard } from '../pricing/rate-card'
import { makeSlug, type IdGenerator } from '../repository/slug'
import type { KitRecord, KitRepository } from '../repository/kit-repository'
import type { CopyGenerator } from '../ai/media-kit-copy'

export interface CreateKitDeps {
  repo: KitRepository
  generateCopy: CopyGenerator
  idGen?: IdGenerator
}

export async function createKit(
  body: unknown,
  deps: CreateKitDeps,
): Promise<{ slug: string }> {
  const stats = CreatorStatsSchema.parse(body)
  const engagementRate = computeEngagementRate(
    stats.followerCount,
    stats.avgLikes,
    stats.avgComments,
  )
  const tier = classifyTier(stats.followerCount)
  const rateCard = computeRateCard(stats)
  const copy = await deps.generateCopy({ ...stats, engagementRate, tier })
  const slug = makeSlug(stats.handle, deps.idGen)

  const record: KitRecord = { slug, stats, engagementRate, tier, rateCard, copy }
  await deps.repo.saveKit(record)
  return { slug }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/services/create-kit.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/create-kit.ts src/lib/services/create-kit.test.ts
git commit -m "feat: add create-kit use-case"
```

---

## Task 11: Supabase migration + repository implementation

**Files:**
- Create: `supabase/migrations/0001_media_kits.sql`
- Create: `src/lib/repository/supabase-kit-repository.ts`
- Create: `src/lib/supabase/server-client.ts`

This task has no unit test (it hits the network). It is verified by the E2E in Task 15 and a manual query.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_media_kits.sql`:
```sql
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
```

- [ ] **Step 2: Apply the migration**

Apply via the Supabase MCP `apply_migration` tool (name `0001_media_kits`) or the Supabase CLI:
```bash
supabase db push
```
Expected: `media_kits` table exists. Verify with a `select count(*) from media_kits;` (returns 0).

- [ ] **Step 3: Add the server Supabase client**

Create `src/lib/supabase/server-client.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase env vars are missing')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
```

- [ ] **Step 4: Implement the Supabase repository**

Create `src/lib/repository/supabase-kit-repository.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreatorStats, RateCard, MediaKitCopy, Tier, Niche, Region } from '../domain/types'
import type { KitRecord, KitRepository } from './kit-repository'

export class SupabaseKitRepository implements KitRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveKit(record: KitRecord): Promise<void> {
    const { stats } = record
    const { error } = await this.client.from('media_kits').insert({
      slug: record.slug,
      handle: stats.handle,
      display_name: stats.displayName,
      email: stats.email,
      niche: stats.niche,
      region: stats.region,
      follower_count: stats.followerCount,
      avg_likes: stats.avgLikes,
      avg_comments: stats.avgComments,
      engagement_rate: record.engagementRate,
      tier: record.tier,
      currency: record.rateCard.currency,
      rate_card: record.rateCard,
      copy: record.copy,
    })
    if (error) throw new Error(`saveKit failed: ${error.message}`)
  }

  async getKitBySlug(slug: string): Promise<KitRecord | null> {
    const { data, error } = await this.client
      .from('media_kits')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw new Error(`getKitBySlug failed: ${error.message}`)
    if (!data) return null

    const stats: CreatorStats = {
      handle: data.handle,
      displayName: data.display_name,
      email: data.email,
      niche: data.niche as Niche,
      region: data.region as Region,
      followerCount: data.follower_count,
      avgLikes: data.avg_likes,
      avgComments: data.avg_comments,
    }
    return {
      slug: data.slug,
      stats,
      engagementRate: Number(data.engagement_rate),
      tier: data.tier as Tier,
      rateCard: data.rate_card as RateCard,
      copy: data.copy as MediaKitCopy,
    }
  }
}
```

- [ ] **Step 5: Verify types compile**

Run: `pnpm tsc --noEmit`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_media_kits.sql src/lib/supabase/server-client.ts src/lib/repository/supabase-kit-repository.ts
git commit -m "feat: add media_kits migration and supabase repository"
```

---

## Task 12: POST /api/media-kit route

**Files:**
- Create: `src/app/api/media-kit/route.ts`
- Test: `src/app/api/media-kit/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/media-kit/route.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'

// Mock the Supabase wiring so the route uses a no-op persistence path.
vi.mock('../../../lib/repository/supabase-kit-repository', () => ({
  SupabaseKitRepository: class {
    saveKit = vi.fn(async () => {})
    getKitBySlug = vi.fn(async () => null)
  },
}))
vi.mock('../../../lib/supabase/server-client', () => ({
  createServerClient: () => ({}),
}))
vi.mock('../../../lib/ai/media-kit-copy', async (orig) => {
  const actual = await orig<typeof import('../../../lib/ai/media-kit-copy')>()
  return {
    ...actual,
    generateMediaKitCopy: async (input: { niche: string; engagementRate: number }) => ({
      headline: `${input.niche} creator`,
      bio: 'bio',
      audienceSummary: 'audience',
      brandFitCategories: [input.niche],
      highlights: [`ER ${input.engagementRate}%`],
    }),
  }
})

import { POST } from './route'

function req(body: unknown): Request {
  return new Request('http://localhost/api/media-kit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/media-kit', () => {
  it('returns 200 and a slug for valid input', async () => {
    const res = await POST(
      req({
        handle: 'aanya.styles',
        displayName: 'Aanya',
        email: 'aanya@example.com',
        niche: 'fashion',
        region: 'IN',
        followerCount: 50000,
        avgLikes: 1400,
        avgComments: 100,
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(typeof json.slug).toBe('string')
    expect(json.slug).toMatch(/^aanya-styles-/)
  })

  it('returns 400 for invalid input', async () => {
    const res = await POST(req({ handle: '' }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/media-kit/route.test.ts`
Expected: FAIL with "Cannot find module './route'".

- [ ] **Step 3: Write minimal implementation**

Create `src/app/api/media-kit/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createKit } from '../../../lib/services/create-kit'
import { SupabaseKitRepository } from '../../../lib/repository/supabase-kit-repository'
import { createServerClient } from '../../../lib/supabase/server-client'
import { generateMediaKitCopy } from '../../../lib/ai/media-kit-copy'

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const repo = new SupabaseKitRepository(createServerClient())
    const result = await createKit(body, { repo, generateCopy: generateMediaKitCopy })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error('create media-kit failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/media-kit/route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/media-kit/route.ts src/app/api/media-kit/route.test.ts
git commit -m "feat: add POST /api/media-kit endpoint"
```

---

## Task 13: Create form page

**Files:**
- Create: `src/app/create/page.tsx`

UI task, verified by the E2E in Task 15.

- [ ] **Step 1: Implement the form**

Create `src/app/create/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NICHES = ['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech']
const REGIONS = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
]

export default function CreatePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const payload = {
      handle: String(form.get('handle')),
      displayName: String(form.get('displayName')),
      email: String(form.get('email')),
      niche: String(form.get('niche')),
      region: String(form.get('region')),
      followerCount: Number(form.get('followerCount')),
      avgLikes: Number(form.get('avgLikes')),
      avgComments: Number(form.get('avgComments')),
    }
    const res = await fetch('/api/media-kit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      setSubmitting(false)
      setError('Could not generate your kit. Check your inputs and try again.')
      return
    }
    const { slug } = await res.json()
    router.push(`/kit/${slug}`)
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Get your free AI media kit</h1>
      <p className="mt-2 text-sm text-gray-500">
        Enter your Instagram stats. We build your media kit and a data-backed rate card.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" data-testid="create-form">
        <input name="handle" required placeholder="instagram handle" className="w-full rounded border p-2" />
        <input name="displayName" required placeholder="your name" className="w-full rounded border p-2" />
        <input name="email" type="email" required placeholder="email" className="w-full rounded border p-2" />
        <select name="niche" required className="w-full rounded border p-2">
          {NICHES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select name="region" required className="w-full rounded border p-2">
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <input name="followerCount" type="number" min={1} required placeholder="followers" className="w-full rounded border p-2" />
        <input name="avgLikes" type="number" min={0} required placeholder="avg likes per post" className="w-full rounded border p-2" />
        <input name="avgComments" type="number" min={0} required placeholder="avg comments per post" className="w-full rounded border p-2" />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded bg-black p-3 text-white disabled:opacity-50">
          {submitting ? 'Building…' : 'Build my media kit'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Verify it renders**

Run: `pnpm dev`, open `http://localhost:3000/create`.
Expected: the form renders with all fields.

- [ ] **Step 3: Commit**

```bash
git add src/app/create/page.tsx
git commit -m "feat: add create media-kit form page"
```

---

## Task 14: Public media-kit page

**Files:**
- Create: `src/app/kit/[slug]/page.tsx`
- Create: `src/components/RateCardTable.tsx`

- [ ] **Step 1: Implement the rate-card component**

Create `src/components/RateCardTable.tsx`:
```tsx
import type { RateCard } from '../lib/domain/types'

const ROWS: { key: 'reel' | 'story' | 'carousel' | 'bundle'; label: string }[] = [
  { key: 'reel', label: 'Reel' },
  { key: 'story', label: 'Story' },
  { key: 'carousel', label: 'Carousel / Post' },
  { key: 'bundle', label: 'Bundle (1 reel + 3 stories)' },
]

export function RateCardTable({ rateCard }: { rateCard: RateCard }) {
  const fmt = (n: number) => `${rateCard.currency} ${n.toLocaleString()}`
  return (
    <table className="w-full text-left text-sm" data-testid="rate-card">
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.key} className="border-b">
            <td className="py-2 font-medium">{row.label}</td>
            <td className="py-2 text-right">
              {fmt(rateCard[row.key].min)} – {fmt(rateCard[row.key].max)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 2: Implement the page**

Create `src/app/kit/[slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { SupabaseKitRepository } from '../../../lib/repository/supabase-kit-repository'
import { createServerClient } from '../../../lib/supabase/server-client'
import { RateCardTable } from '../../../components/RateCardTable'

export default async function KitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const repo = new SupabaseKitRepository(createServerClient())
  const kit = await repo.getKitBySlug(slug)
  if (!kit) notFound()

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header>
        <h1 className="text-3xl font-semibold">{kit.stats.displayName}</h1>
        <p className="text-gray-500">@{kit.stats.handle} · {kit.stats.niche} · {kit.tier}</p>
        <p className="mt-1 text-sm text-gray-500">
          {kit.stats.followerCount.toLocaleString()} followers · {kit.engagementRate}% engagement
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-lg font-medium">{kit.copy.headline}</h2>
        <p className="mt-2 text-gray-700">{kit.copy.bio}</p>
        <p className="mt-2 text-sm text-gray-600">{kit.copy.audienceSummary}</p>
      </section>

      <section className="mt-6">
        <h3 className="font-medium">Good fit for</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {kit.copy.brandFitCategories.map((c) => (
            <span key={c} className="rounded-full bg-gray-100 px-3 py-1 text-sm">{c}</span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="font-medium">Rate card</h3>
        <div className="mt-2">
          <RateCardTable rateCard={kit.rateCard} />
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Verify a kit renders**

Submit the form at `/create`, confirm redirect to `/kit/<slug>` showing the rate card.

- [ ] **Step 4: Commit**

```bash
git add src/app/kit src/components/RateCardTable.tsx
git commit -m "feat: add public media-kit page with rate card"
```

---

## Task 15: Landing page + E2E happy path

**Files:**
- Create/Modify: `src/app/page.tsx`
- Create: `playwright.config.ts`
- Create: `e2e/create-kit.spec.ts`

- [ ] **Step 1: Replace the landing page**

Create/overwrite `src/app/page.tsx`:
```tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 p-10">
      <h1 className="text-4xl font-semibold">An AI manager for every creator.</h1>
      <p className="text-lg text-gray-600">
        Build a professional media kit and a data-backed rate card in 60 seconds. Free.
      </p>
      <Link href="/create" className="rounded bg-black px-5 py-3 text-white" data-testid="cta">
        Get your free media kit
      </Link>
    </main>
  )
}
```

- [ ] **Step 2: Add Playwright config**

Create `playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

- [ ] **Step 3: Write the E2E happy path**

Create `e2e/create-kit.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('creator builds a media kit and sees a rate card', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('cta').click()

  await page.fill('input[name="handle"]', 'aanya.styles')
  await page.fill('input[name="displayName"]', 'Aanya')
  await page.fill('input[name="email"]', 'aanya@example.com')
  await page.selectOption('select[name="niche"]', 'fashion')
  await page.selectOption('select[name="region"]', 'IN')
  await page.fill('input[name="followerCount"]', '50000')
  await page.fill('input[name="avgLikes"]', '1400')
  await page.fill('input[name="avgComments"]', '100')
  await page.getByRole('button', { name: /build my media kit/i }).click()

  await expect(page).toHaveURL(/\/kit\//)
  await expect(page.getByTestId('rate-card')).toBeVisible()
  await expect(page.getByText(/INR/).first()).toBeVisible()
})
```

- [ ] **Step 4: Run the E2E**

Prereq: a real `.env.local` with Supabase + AI Gateway keys, and the migration applied.
Run: `pnpm exec playwright install --with-deps chromium && pnpm e2e`
Expected: 1 test passes (form → kit page with a visible rate card).

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx playwright.config.ts e2e/create-kit.spec.ts
git commit -m "feat: add landing page and create-kit E2E"
```

---

## Task 16: Full test pass + coverage

- [ ] **Step 1: Run the whole unit suite**

Run: `pnpm test`
Expected: all unit/integration tests pass.

- [ ] **Step 2: Check coverage on the pricing core**

Run: `pnpm vitest run --coverage`
Expected: `src/lib/pricing/**` and `src/lib/services/**` at or above 80% line coverage. Add cases for any uncovered branch (for example a `food` niche or `mid` tier rate-card assertion).

- [ ] **Step 3: Typecheck and build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: no type errors, clean production build.

- [ ] **Step 4: Commit any coverage additions**

```bash
git add -A
git commit -m "test: raise pricing coverage to 80%+"
```

---

## Self-review notes (already applied)

- **Spec coverage:** Phase 0 = "free media-kit + rate-card tool" (spec §11). Covered by Tasks 2-16. Payments/escrow, brand agent, compliance, and corridor are deliberately out of scope (later phases, separate plans).
- **Type consistency:** `CreatorStats`, `RateCard`, `Band`, `MediaKitCopy`, `KitRecord`, `CopyGenerator`, `IdGenerator` defined once and reused. `computeEngagementRate`, `classifyTier`, `getBasePostRate`, `computeRateCard`, `makeSlug`, `createKit`, `saveKit`, `getKitBySlug` names match across all tasks.
- **No placeholders:** every code step ships full code; every test ships real assertions with computed expected values.
- **Determinism:** rate-card expected numbers are hand-computed in the plan; AI and DB are injected/mocked in unit tests so the suite is offline and stable.

## Open follow-ups (next plans, not this one)

- Instagram OAuth via Meta Graph API behind the `InstagramStatsProvider` seam (replaces manual entry).
- Creator auth + edit/republish of a kit.
- Rate-card dataset analytics view (the moat asset).
- Shareable kit OG-image generation.
