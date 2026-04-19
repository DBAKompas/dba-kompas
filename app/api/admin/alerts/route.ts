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
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return user
}

// ── GET: haal openstaande alerts op ──────────────────────────────────────────

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('admin_alerts')
    .select('id, type, severity, title, message, metadata, email_sent, created_at')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(50)

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
