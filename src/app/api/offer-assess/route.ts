import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { DealInputSchema } from '../../../lib/domain/types'
import { getCreatorIdFromRequest } from '../../../lib/auth/server'
import { assessOffer } from '../../../lib/ai/offer-agent'
import { createServiceClient } from '../../../lib/supabase/server-client'

// Assess an inbound offer against the creator's rate floor and draft a reply.
// Floor comes from the request, falling back to the creator's stored rate_floor.
export async function POST(request: Request): Promise<Response> {
  const creatorId = await getCreatorIdFromRequest(request)
  if (!creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { offer?: unknown; floor?: number }
  try {
    body = (await request.json()) as { offer?: unknown; floor?: number }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const offer = DealInputSchema.parse(body.offer)

    let floor = typeof body.floor === 'number' ? body.floor : null
    let displayName = 'there'
    const { data } = await createServiceClient()
      .from('creators')
      .select('display_name, rate_floor')
      .eq('id', creatorId)
      .maybeSingle<{ display_name: string; rate_floor: number | null }>()
    if (data) {
      displayName = data.display_name ?? displayName
      if (floor === null && data.rate_floor !== null) floor = Number(data.rate_floor)
    }
    if (floor === null) {
      return NextResponse.json({ error: 'Set a rate floor first' }, { status: 400 })
    }

    const assessment = await assessOffer({ displayName, floor, offer })
    return NextResponse.json(assessment, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error('offer assess failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
