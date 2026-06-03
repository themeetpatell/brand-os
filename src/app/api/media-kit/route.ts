import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createKit } from '../../../lib/services/create-kit'
import { SupabaseKitRepository } from '../../../lib/repository/supabase-kit-repository'
import { createServerClient } from '../../../lib/supabase/server-client'
import { generateMediaKitCopy } from '../../../lib/ai/media-kit-copy'

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const repo = new SupabaseKitRepository(createServerClient())
    const result = await createKit(body, { repo, generateCopy: generateMediaKitCopy })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error('create media-kit failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
