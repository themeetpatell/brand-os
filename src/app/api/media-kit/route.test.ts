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
