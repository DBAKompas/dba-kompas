import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: Record<string, unknown>) { cookieStore.delete({ name, ...options }) },
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: NextResponse.json({ error: 'Geen toegang' }, { status: 403 }) }

  return { userId: user.id }
}

export async function GET() {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Haal alle assessments op met user info via profiles
  const { data: assessments, error } = await admin
    .from('dba_assessments')
    .select('id, user_id, created_at, overall_risk_label, risk_score')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/analyses] query error:', error.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  // Haal profiles op voor email + plan
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, plan')

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Groepeer per gebruiker
  type GebruikerAnalyse = {
    user_id: string
    email: string
    plan: string | null
    totaal: number
    laag: number
    gemiddeld: number
    hoog: number
    laatste: string
  }

  const perGebruiker = new Map<string, GebruikerAnalyse>()

  for (const a of assessments ?? []) {
    const profiel = profileMap.get(a.user_id)
    if (!perGebruiker.has(a.user_id)) {
      perGebruiker.set(a.user_id, {
        user_id: a.user_id,
        email: profiel?.email ?? 'Onbekend',
        plan: profiel?.plan ?? null,
        totaal: 0,
        laag: 0,
        gemiddeld: 0,
        hoog: 0,
        laatste: a.created_at,
      })
    }
    const entry = perGebruiker.get(a.user_id)!
    entry.totaal++
    const label = a.overall_risk_label ?? 'onbekend'
    if (label === 'laag') entry.laag++
    else if (label === 'gemiddeld') entry.gemiddeld++
    else if (label === 'hoog') entry.hoog++
    if (a.created_at > entry.laatste) entry.laatste = a.created_at
  }

  const resultaat = Array.from(perGebruiker.values())
    .sort((a, b) => b.totaal - a.totaal)

  return NextResponse.json({ analyses: resultaat })
}
