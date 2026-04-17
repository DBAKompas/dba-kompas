import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: NextResponse.json({ error: 'Geen toegang' }, { status: 403 }) }

  return { userId: user.id }
}

export async function GET() {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const [{ data: assessments, error }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from('dba_assessments').select('id, user_id, created_at, overall_risk_label').order('created_at', { ascending: false }),
    supabaseAdmin.from('profiles').select('id, email, plan'),
  ])

  if (error) {
    console.error('[admin/analyses] query error:', error.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  type GebruikerAnalyse = {
    user_id: string; email: string; plan: string | null
    totaal: number; laag: number; gemiddeld: number; hoog: number; laatste: string
  }

  const perGebruiker = new Map<string, GebruikerAnalyse>()

  for (const a of assessments ?? []) {
    const profiel = profileMap.get(a.user_id)
    if (!perGebruiker.has(a.user_id)) {
      perGebruiker.set(a.user_id, {
        user_id: a.user_id, email: profiel?.email ?? 'Onbekend', plan: profiel?.plan ?? null,
        totaal: 0, laag: 0, gemiddeld: 0, hoog: 0, laatste: a.created_at,
      })
    }
    const entry = perGebruiker.get(a.user_id)!
    entry.totaal++
    if (a.overall_risk_label === 'laag') entry.laag++
    else if (a.overall_risk_label === 'gemiddeld') entry.gemiddeld++
    else if (a.overall_risk_label === 'hoog') entry.hoog++
    if (a.created_at > entry.laatste) entry.laatste = a.created_at
  }

  return NextResponse.json({ analyses: Array.from(perGebruiker.values()).sort((a, b) => b.totaal - a.totaal) })
}
