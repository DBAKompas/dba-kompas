import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ── Auth helper ────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: user.id }
}

// ── GET — alle issues ophalen ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const status = req.nextUrl.searchParams.get('status') // 'open' | 'resolved' | null = alle
  let query = supabaseAdmin
    .from('test_issues')
    .select('*')
    .order('created_at', { ascending: false })

  if (status === 'open' || status === 'resolved') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST — nieuw issue aanmaken ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { test_id, description, prompt } = body

  if (!test_id || !description || !prompt) {
    return NextResponse.json(
      { error: 'test_id, description en prompt zijn verplicht' },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('test_issues')
    .insert({
      test_id,
      description: description.trim(),
      prompt: prompt.trim(),
      status: 'open',
      created_by: auth.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// ── PATCH — issue oplossen ────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'id en status zijn verplicht' }, { status: 400 })
  }

  if (!['open', 'resolved'].includes(status)) {
    return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('test_issues')
    .update({
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Bijwerken mislukt' }, { status: 500 })
  return NextResponse.json(data)
}
