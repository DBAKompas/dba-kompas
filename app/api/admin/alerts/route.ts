import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveAlert } from '@/lib/admin/alerts'

export const dynamic = 'force-dynamic'

// ── Auth check helper ─────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return user
}

// ── GET: haal alerts op (met optionele filters) ───────────────────────────────
//
// Query params:
//   status   = 'open' (default) | 'resolved' | 'all'
//   severity = 'critical' | 'warning' | 'info'  (optioneel)
//   type     = alert type string                  (optioneel)
//   limit    = max aantal resultaten (default 100, max 200)

export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status   = searchParams.get('status')   ?? 'open'
  const severity = searchParams.get('severity') ?? ''
  const type     = searchParams.get('type')     ?? ''
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 200)

  let query = supabaseAdmin
    .from('admin_alerts')
    .select('id, type, severity, title, message, metadata, email_sent, resolved, resolved_at, resolved_by, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status === 'open') {
    query = query.eq('resolved', false)
  } else if (status === 'resolved') {
    query = query.eq('resolved', true)
  }
  // status === 'all' → geen filter op resolved

  if (severity) {
    query = query.eq('severity', severity)
  }

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alerts: data ?? [] })
}

// ── PATCH: markeer alert als opgelost ─────────────────────────────────────────

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { alertId } = body

  if (!alertId || typeof alertId !== 'string') {
    return NextResponse.json({ error: 'alertId verplicht' }, { status: 400 })
  }

  const ok = await resolveAlert(alertId, user.id)
  if (!ok) {
    return NextResponse.json({ error: 'Oplossen mislukt' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
