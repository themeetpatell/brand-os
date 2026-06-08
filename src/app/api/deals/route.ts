import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getCreatorIdFromRequest } from '../../../lib/auth/server'
import { getServerDeps } from '../../../lib/server/deps'
import { logDeal } from '../../../lib/services/log-deal'

export async function POST(request: Request): Promise<Response> {
  const creatorId = await getCreatorIdFromRequest(request)
  if (!creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const deps = getServerDeps()
    const deal = await logDeal(creatorId, body, { repo: deps.dealRepo, events: deps.events })
    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((i) => ({ path: i.path, message: i.message }))
      return NextResponse.json({ error: 'Invalid input', issues }, { status: 400 })
    }
    console.error('log deal failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: Request): Promise<Response> {
  const creatorId = await getCreatorIdFromRequest(request)
  if (!creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deps = getServerDeps()
    const deals = await deps.dealRepo.listDealsByCreator(creatorId)
    return NextResponse.json({ deals }, { status: 200 })
  } catch (error) {
    console.error('list deals failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
