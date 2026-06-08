import { describe, expect, it, vi } from 'vitest'

const saved: unknown[] = []

vi.mock('../../../lib/server/deps', () => ({
  getServerDeps: () => ({
    briefRepo: {
      saveBrief: vi.fn(async (b: unknown) => { saved.push(b) }),
      listOpenBriefs: vi.fn(async () => [
        { id: 'b1', brandId: 'brand_1', title: 'T', goal: 'g', budgetMin: 8000, budgetMax: 25000, currency: 'INR', niche: 'beauty', region: 'IN', deliverables: ['1 reel'], status: 'open', createdAt: 't' },
        { id: 'b2', brandId: 'brand_1', title: 'T2', goal: 'g', budgetMin: 8000, budgetMax: 9000, currency: 'INR', niche: 'fashion', region: 'IN', deliverables: ['1 reel'], status: 'open', createdAt: 't' },
      ]),
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
