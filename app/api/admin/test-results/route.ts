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

// ── GET - alle testresultaten ophalen ─────────────────────────────────────

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { data, error } = await supabaseAdmin
    .from('test_results')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST - testresultaat opslaan (upsert op test_id) ──────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { test_id, status, notes } = body

  if (!test_id || !status) {
    return NextResponse.json({ error: 'test_id en status zijn verplicht' }, { status: 400 })
  }

  if (!['pending', 'passed', 'failed'].includes(status)) {
    return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('test_results')
    .upsert(
      {
        test_id,
        status,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      },
      { onConflict: 'test_id' },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })
  return NextResponse.json(data)
}
