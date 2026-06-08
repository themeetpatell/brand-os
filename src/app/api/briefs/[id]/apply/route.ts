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
