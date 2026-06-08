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
