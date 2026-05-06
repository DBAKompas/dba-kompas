import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type LinkStatus = 'unused' | 'used' | 'expired'

interface WelcomeLinkRow {
  token: string
  referral_code: string
  campaign_label: string | null
  created_by: string | null
  created_at: string
  expires_at: string | null
  used_at: string | null
  used_by: string | null
}

interface ProfileRow {
  user_id: string
  first_name: string | null
  last_name: string | null
}

function deriveStatus(row: WelcomeLinkRow): LinkStatus {
  if (row.used_at) return 'used'
  if (row.expires_at && new Date(row.expires_at) < new Date()) return 'expired'
  return 'unused'
}

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
 * GET /api/admin/referral/welcome-link/list
 *
 * Query params:
 *   status: 'all' | 'unused' | 'used' | 'expired' (default 'all')
 *   limit:  number (default 100, max 500)
 *
 * Response 200: { ok: true, items: Array<...> }
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const statusParam = (req.nextUrl.searchParams.get('status') ?? 'all') as 'all' | LinkStatus
  const limitRaw = parseInt(req.nextUrl.searchParams.get('limit') ?? '100', 10)
  const limit = Math.min(Math.max(isNaN(limitRaw) ? 100 : limitRaw, 1), 500)

  const { data: links, error: linksErr } = await supabaseAdmin
    .from('welcome_links')
    .select('token, referral_code, campaign_label, created_by, created_at, expires_at, used_at, used_by')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (linksErr) {
    console.error('[admin/welcome-link/list] db error:', linksErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const rows = (links ?? []) as WelcomeLinkRow[]

  // Verzamel alle user-ids voor lookup (creator + redeemer)
  const userIds = new Set<string>()
  for (const r of rows) {
    if (r.created_by) userIds.add(r.created_by)
    if (r.used_by) userIds.add(r.used_by)
  }

  let profilesById = new Map<string, ProfileRow>()
  let emailById = new Map<string, string | null>()

  if (userIds.size > 0) {
    const ids = Array.from(userIds)

    // Profile-namen via gewone tabel (RLS bypass via service-role)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', ids)

    profilesById = new Map<string, ProfileRow>(
      ((profiles ?? []) as ProfileRow[]).map(p => [p.user_id, p])
    )

    // E-mails via auth.admin.listUsers (Supabase JS client kan auth.users niet
    // via .schema('auth').from('users') queryen). perPage 1000 is voldoende
    // voor admin-counts; pagination wordt pas relevant boven 1000 users.
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin
        .listUsers({ perPage: 1000 })
      if (authErr) {
        console.warn('[admin/welcome-link/list] auth.admin.listUsers fout:', authErr.message)
      } else {
        const wantedIds = new Set(ids)
        emailById = new Map<string, string | null>(
          (authData?.users ?? [])
            .filter(u => wantedIds.has(u.id))
            .map(u => [u.id, u.email ?? null])
        )
      }
    } catch (err) {
      console.warn('[admin/welcome-link/list] auth.admin.listUsers exception:', err)
    }
  }

  const items = rows
    .map(r => {
      const status = deriveStatus(r)
      const creator = r.created_by ? profilesById.get(r.created_by) : null
      const redeemer = r.used_by ? profilesById.get(r.used_by) : null
      return {
        token: r.token,
        referralCode: r.referral_code,
        campaignLabel: r.campaign_label,
        status,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        usedAt: r.used_at,
        creator: r.created_by ? {
          userId: r.created_by,
          name: [creator?.first_name, creator?.last_name].filter(Boolean).join(' ') || null,
          email: emailById.get(r.created_by) ?? null,
        } : null,
        redeemer: r.used_by ? {
          userId: r.used_by,
          name: [redeemer?.first_name, redeemer?.last_name].filter(Boolean).join(' ') || null,
          email: emailById.get(r.used_by) ?? null,
        } : null,
      }
    })
    .filter(item => statusParam === 'all' ? true : item.status === statusParam)

  return NextResponse.json({ ok: true, items })
}
