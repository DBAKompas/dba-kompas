import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const MAX_CODE_RETRIES = 5
const MAX_TOKEN_RETRIES = 5

/**
 * POST /api/admin/referral/welcome-link/create
 *
 * Genereert een welcome-code + token en slaat beide op.
 * De geretourneerde URL is de deelbare LinkedIn-link.
 *
 * Body (optioneel): { campaignLabel?: string, expiresAt?: string (ISO) }
 *
 * Response 200: { ok: true, url, token, code, campaignLabel }
 * Response 401: niet ingelogd
 * Response 403: geen admin
 * Response 500: aanmaak gefaald
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const campaignLabel: string = typeof body?.campaignLabel === 'string' && body.campaignLabel
      ? body.campaignLabel
      : 'LINKEDIN-GRATIS-CHECK'
    const expiresAt: string | null = typeof body?.expiresAt === 'string' ? body.expiresAt : null

    // 1. Genereer welcome-code met retry op UNIQUE conflict
    let code: string | null = null
    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const candidate = randomBytes(4).toString('hex').toUpperCase()
      const { data, error } = await supabaseAdmin
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: candidate,
          code_type: 'welcome',
          issuer_role: 'admin',
          expires_at: null,
        })
        .select('code')
        .single()
      if (!error && data) { code = data.code; break }
    }

    if (!code) {
      console.error('[admin/welcome-link/create] kon geen unieke welcome-code genereren')
      return NextResponse.json({ error: 'code_generation_failed' }, { status: 500 })
    }

    // 2. Genereer token met retry op UNIQUE conflict
    let token: string | null = null
    for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
      const candidate = randomBytes(12).toString('base64url')
      const { data, error } = await supabaseAdmin
        .from('welcome_links')
        .insert({
          token: candidate,
          referral_code: code,
          campaign_label: campaignLabel,
          created_by: user.id,
          expires_at: expiresAt,
        })
        .select('token')
        .single()
      if (!error && data) { token = data.token; break }
    }

    if (!token) {
      console.error('[admin/welcome-link/create] kon geen unieke token genereren')
      return NextResponse.json({ error: 'token_generation_failed' }, { status: 500 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbakompas.nl').replace(/\/+$/, '')
    const url = `${appUrl}/c/${token}`

    return NextResponse.json({ ok: true, url, token, code, campaignLabel })
  } catch (err) {
    console.error('[admin/welcome-link/create] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
