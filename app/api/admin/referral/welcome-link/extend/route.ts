import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const DEFAULT_DAYS = 7
const MAX_DAYS = 365

async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: user.id }
}

/**
 * POST /api/admin/referral/welcome-link/extend
 *
 * Body: { token: string, days?: number }
 *
 * Verlengt expires_at naar now() + days.
 * Werkt alleen op welcome_links die nog niet gebruikt zijn (used_at IS NULL).
 *
 * Response 200: { ok: true, token, expiresAt }
 * Response 400: ongeldige input
 * Response 404: token niet gevonden of al gebruikt
 * Response 401/403: auth
 */
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const token = (body as { token?: unknown })?.token
  const daysRaw = (body as { days?: unknown })?.days

  if (typeof token !== 'string' || token.length === 0) {
    return NextResponse.json({ error: 'token_required' }, { status: 400 })
  }

  let days = DEFAULT_DAYS
  if (typeof daysRaw === 'number' && Number.isFinite(daysRaw)) {
    days = Math.floor(daysRaw)
  }
  if (days < 1 || days > MAX_DAYS) {
    return NextResponse.json({ error: 'days_out_of_range' }, { status: 400 })
  }

  const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  // Update enkel als nog niet gebruikt. .select() retourneert de bijgewerkte rij of niets.
  const { data: updated, error } = await supabaseAdmin
    .from('welcome_links')
    .update({ expires_at: newExpiry })
    .eq('token', token)
    .is('used_at', null)
    .select('token, expires_at')
    .maybeSingle()

  if (error) {
    console.error('[admin/welcome-link/extend] db error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!updated) {
    return NextResponse.json({ error: 'not_found_or_used' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    token: updated.token,
    expiresAt: updated.expires_at,
  })
}
