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
