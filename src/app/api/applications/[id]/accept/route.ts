import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../../lib/auth/server'
import { getServerDeps } from '../../../../../lib/server/deps'
import { createServiceClient } from '../../../../../lib/supabase/server-client'
import { acceptApplication } from '../../../../../lib/services/accept-application'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const { data: brand } = await createServiceClient()
      .from('brands').select('name').eq('id', userId).maybeSingle<{ name: string }>()
    if (!brand) return NextResponse.json({ error: 'Not a brand account' }, { status: 403 })

    const deps = getServerDeps()
    const deal = await acceptApplication(userId, id, brand.name, {
      appRepo: deps.appRepo, briefRepo: deps.briefRepo, dealRepo: deps.dealRepo, events: deps.events,
    })
    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Could not accept' }, { status: 400 })
  }
}
