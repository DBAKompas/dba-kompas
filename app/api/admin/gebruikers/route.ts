import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
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

type QuotaPlan = 'free' | 'monthly' | 'yearly' | 'one_time'

export async function GET() {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  // 1. Profielen (identiteit + rol)
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, user_id, email, role, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('[admin/gebruikers] profiles query error:', profilesError.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  // 2. Actieve abonnementen (monthly/yearly)
  const { data: subs, error: subsError } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, status, plan')
    .in('status', ['active', 'trialing'])

  if (subsError) {
    console.error('[admin/gebruikers] subscriptions query error:', subsError.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  // 3. Eenmalige aankopen (one_time)
  const { data: oneTime, error: oneTimeError } = await supabaseAdmin
    .from('one_time_purchases')
    .select('user_id')
    .eq('status', 'purchased')

  if (oneTimeError) {
    console.error('[admin/gebruikers] one_time_purchases query error:', oneTimeError.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  // 4. Map user_id -> effectief plan (subscription wint van one_time wint van free)
  const planPerUser = new Map<string, QuotaPlan>()
  for (const sub of subs ?? []) {
    if (sub.plan === 'monthly' || sub.plan === 'yearly') {
      planPerUser.set(sub.user_id, sub.plan)
    }
  }
  for (const purchase of oneTime ?? []) {
    if (!planPerUser.has(purchase.user_id)) {
      planPerUser.set(purchase.user_id, 'one_time')
    }
  }

  const gebruikers = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    plan: planPerUser.get(p.user_id) ?? 'free',
    role: p.role,
    created_at: p.created_at,
  }))

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
