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
