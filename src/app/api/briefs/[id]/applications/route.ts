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
