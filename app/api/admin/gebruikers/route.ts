import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getQuotaPlansForUsers,
  resolveAbonnementStatus,
  resolveEenmaligStatus,
  type AbonnementStatus,
  type EenmaligStatus,
  type QuotaPlan,
} from '@/modules/billing/entitlements'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: NextResponse.json({ error: 'Geen toegang' }, { status: 403 }) }

  return { userId: user.id }
}

type SubscriptionRow = {
  user_id: string
  status: string | null
  plan: string | null
  cancel_at_period_end: boolean | null
  current_period_end: string | null
  payment_failed: boolean | null
}

type OneTimeRow = {
  user_id: string
  status: string | null
  credit_used: boolean | null
  credit_used_at: string | null
  finalized_at: string | null
  created_at: string | null
}

type Gebruiker = {
  id: string
  user_id: string
  email: string | null
  role: string | null
  plan: QuotaPlan
  created_at: string
  last_sign_in_at: string | null
  aantal_analyses: number
  last_analyse_at: string | null
  last_news_read_at: string | null
  subscription: {
    status: string | null
    plan: string | null
    cancel_at_period_end: boolean | null
    current_period_end: string | null
    payment_failed: boolean | null
  } | null
  one_time: {
    status: string | null
    credit_used: boolean | null
    credit_used_at: string | null
    finalized_at: string | null
  } | null
  abonnement_status: AbonnementStatus
  eenmalig_status: EenmaligStatus
}

export async function GET() {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  // 1. Profielen ophalen ----------------------------------------------------
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, user_id, email, role, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('[admin/gebruikers] profiles query error:', profilesError.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  const userIds = (profiles ?? []).map((p) => p.user_id)

  if (userIds.length === 0) {
    return NextResponse.json({ gebruikers: [] })
  }

  // 2. Parallel: plan-resolutie, subscriptions, one_time, assessments,
  //    user_news_read en auth-users (voor last_sign_in_at) ----------------
  type AuthUsersResult = {
    data: { users: Array<{ id: string; last_sign_in_at: string | null }> }
    error: { message: string } | null
  }

  const [
    planPerUserResult,
    subsResponse,
    oneTimeResponse,
    assessmentsResponse,
    newsReadResponse,
    authUsersResult,
  ] = await Promise.all([
    getQuotaPlansForUsers(supabaseAdmin, userIds).catch((err) => err as Error),
    supabaseAdmin
      .from('subscriptions')
      .select(
        'user_id, status, plan, cancel_at_period_end, current_period_end, payment_failed'
      )
      .in('user_id', userIds),
    supabaseAdmin
      .from('one_time_purchases')
      .select(
        'user_id, status, credit_used, credit_used_at, finalized_at, created_at'
      )
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('dba_assessments')
      .select('user_id, created_at')
      .in('user_id', userIds),
    // user_news_read is zacht vereist; als tabel nog niet bestaat,
    // slaan we het veld over i.p.v. hele endpoint te laten falen.
    supabaseAdmin
      .from('user_news_read')
      .select('user_id, created_at')
      .in('user_id', userIds),
    supabaseAdmin.auth.admin
      .listUsers({ perPage: 1000 })
      .then((res) => res as unknown as AuthUsersResult)
      .catch(
        (err) =>
          ({
            data: { users: [] },
            error: { message: err instanceof Error ? err.message : 'unknown' },
          }) satisfies AuthUsersResult
      ),
  ])

  if (planPerUserResult instanceof Error) {
    console.error('[admin/gebruikers] plan-resolve error:', planPerUserResult.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }
  const planPerUser = planPerUserResult

  if (subsResponse.error) {
    console.error('[admin/gebruikers] subs query error:', subsResponse.error.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }
  if (oneTimeResponse.error) {
    console.error('[admin/gebruikers] one_time query error:', oneTimeResponse.error.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }
  if (assessmentsResponse.error) {
    console.error('[admin/gebruikers] assessments query error:', assessmentsResponse.error.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  // user_news_read mag ontbreken; alleen hard loggen, niet blokkeren
  const newsReadRows: Array<{ user_id: string; created_at: string | null }> =
    newsReadResponse.error ? [] : (newsReadResponse.data ?? [])
  if (newsReadResponse.error) {
    console.warn(
      '[admin/gebruikers] user_news_read query skipped:',
      newsReadResponse.error.message
    )
  }

  if (authUsersResult.error) {
    console.warn(
      '[admin/gebruikers] auth.admin.listUsers skipped:',
      authUsersResult.error.message
    )
  }

  // 3. Indexen opbouwen -----------------------------------------------------
  const subsByUser = new Map<string, SubscriptionRow>()
  for (const row of (subsResponse.data ?? []) as SubscriptionRow[]) {
    subsByUser.set(row.user_id, row)
  }

  // Meest recente one_time per user (rijen zijn al DESC op created_at)
  const oneTimeByUser = new Map<string, OneTimeRow>()
  for (const row of (oneTimeResponse.data ?? []) as OneTimeRow[]) {
    if (!oneTimeByUser.has(row.user_id)) {
      oneTimeByUser.set(row.user_id, row)
    }
  }

  const analysesCountByUser = new Map<string, number>()
  const lastAnalyseByUser = new Map<string, string>()
  for (const row of (assessmentsResponse.data ?? []) as Array<{
    user_id: string
    created_at: string | null
  }>) {
    analysesCountByUser.set(
      row.user_id,
      (analysesCountByUser.get(row.user_id) ?? 0) + 1
    )
    if (row.created_at) {
      const huidige = lastAnalyseByUser.get(row.user_id)
      if (!huidige || row.created_at > huidige) {
        lastAnalyseByUser.set(row.user_id, row.created_at)
      }
    }
  }

  const lastNewsReadByUser = new Map<string, string>()
  for (const row of newsReadRows) {
    if (!row.created_at) continue
    const huidige = lastNewsReadByUser.get(row.user_id)
    if (!huidige || row.created_at > huidige) {
      lastNewsReadByUser.set(row.user_id, row.created_at)
    }
  }

  const lastSignInByUser = new Map<string, string | null>()
  for (const authUser of authUsersResult.data?.users ?? []) {
    lastSignInByUser.set(authUser.id, authUser.last_sign_in_at ?? null)
  }

  // 4. Samenstellen payload -------------------------------------------------
  const gebruikers: Gebruiker[] = (profiles ?? []).map((p) => {
    const sub = subsByUser.get(p.user_id) ?? null
    const ot = oneTimeByUser.get(p.user_id) ?? null

    return {
      id: p.id,
      user_id: p.user_id,
      email: p.email,
      role: p.role,
      plan: planPerUser.get(p.user_id) ?? 'free',
      created_at: p.created_at,
      last_sign_in_at: lastSignInByUser.get(p.user_id) ?? null,
      aantal_analyses: analysesCountByUser.get(p.user_id) ?? 0,
      last_analyse_at: lastAnalyseByUser.get(p.user_id) ?? null,
      last_news_read_at: lastNewsReadByUser.get(p.user_id) ?? null,
      subscription: sub
        ? {
            status: sub.status ?? null,
            plan: sub.plan ?? null,
            cancel_at_period_end: sub.cancel_at_period_end ?? null,
            current_period_end: sub.current_period_end ?? null,
            payment_failed: sub.payment_failed ?? null,
          }
        : null,
      one_time: ot
        ? {
            status: ot.status ?? null,
            credit_used: ot.credit_used ?? null,
            credit_used_at: ot.credit_used_at ?? null,
            finalized_at: ot.finalized_at ?? null,
          }
        : null,
      abonnement_status: resolveAbonnementStatus({
        subscription: sub
          ? {
              status: sub.status ?? null,
              plan: sub.plan ?? null,
              cancel_at_period_end: sub.cancel_at_period_end ?? null,
            }
          : null,
      }),
      eenmalig_status: resolveEenmaligStatus({
        oneTimePurchase: ot
          ? {
              status: ot.status ?? null,
              credit_used: ot.credit_used ?? null,
            }
          : null,
      }),
    }
  })

  return NextResponse.json({ gebruikers })
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const body = await request.json()
  const { email, actie } = body as { email?: string; actie?: string }

  if (!email || !actie) {
    return NextResponse.json({ error: 'email en actie zijn verplicht' }, { status: 400 })
  }

  if (actie === 'reset_password') {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    })
    if (error) {
      console.error('[admin/gebruikers] resetPasswordForEmail error:', error.message)
      return NextResponse.json({ error: 'Kan reset-mail niet sturen' }, { status: 500 })
    }
    return NextResponse.json({ success: true, bericht: `Wachtwoord-reset mail verstuurd naar ${email}` })
  }

  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 })
}
