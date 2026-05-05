import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const MAX_BATCH = 50
const MAX_INSERT_RETRIES = 5

/**
 * POST /api/admin/referral/issue-welcome
 *
 * Geeft N welcome-codes uit (code_type='welcome', issuer_role='admin').
 * Welcome-codes hebben geen expires_at en geven na inwisseling 100% gratis check.
 * De redeemer-flow loopt via /api/referral/track met redemption_kind='welcome_free_check'.
 *
 * Body: { count?: number }
 *   count: integer 1..50, default 1
 *
 * Response 200: { issued: Array<{ id, code }> }
 * Response 400: ongeldige input
 * Response 401: niet ingelogd
 * Response 403: geen admin
 * Response 500: onverwachte fout
 */

function generateWelcomeCode(): string {
  // 4 bytes = 8 hex chars uppercase, bv "A3F2B1C8"
  return randomBytes(4).toString('hex').toUpperCase()
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single()
  return data?.role === 'admin'
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const requestedCount = typeof body?.count === 'number' ? body.count : 1
    if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > MAX_BATCH) {
      return NextResponse.json(
        { error: `count must be an integer between 1 and ${MAX_BATCH}` },
        { status: 400 },
      )
    }

    const issued: Array<{ id: string; code: string }> = []
    for (let i = 0; i < requestedCount; i++) {
      let inserted: { id: string; code: string } | null = null
      for (let attempt = 0; attempt < MAX_INSERT_RETRIES; attempt++) {
        const candidate = generateWelcomeCode()
        const { data, error } = await supabaseAdmin
          .from('referral_codes')
          .insert({
            user_id: user.id,
            code: candidate,
            code_type: 'welcome',
            issuer_role: 'admin',
            expires_at: null,
          })
          .select('id, code')
          .single()
        if (!error && data) { inserted = data; break }
      }

      if (!inserted) {
        console.error('[admin/issue-welcome] kon geen unieke welcome-code genereren na retries')
        return NextResponse.json(
          { error: 'Could not generate unique code', issued },
          { status: 500 },
        )
      }
      issued.push(inserted)
    }

    return NextResponse.json({ issued })
  } catch (err) {
    console.error('[admin/issue-welcome] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
