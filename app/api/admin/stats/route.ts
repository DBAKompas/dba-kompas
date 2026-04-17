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
  try {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const zevenDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totaalGebruikers,
    nieuwDezeWeek,
    planVerdeling,
    totaalAnalyses,
    analysesDezeWeek,
    risicoVerdeling,
    totaalQuickScans,
    quickScansDezeWeek,
  ] = await Promise.all([
    // Totaal gebruikers
    admin.from('profiles').select('id', { count: 'exact', head: true }),

    // Nieuwe gebruikers afgelopen 7 dagen
    admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', zevenDagenGeleden),

    // Gebruikers per plan
    admin.from('profiles').select('plan'),

    // Totaal analyses
    admin.from('dba_assessments').select('id', { count: 'exact', head: true }),

    // Analyses afgelopen 7 dagen
    admin.from('dba_assessments').select('id', { count: 'exact', head: true }).gte('created_at', zevenDagenGeleden),

    // Risicoverdeling
    admin.from('dba_assessments').select('overall_risk_label'),

    // Totaal quick scans (tabel is nieuw — fout wordt afgevangen)
    admin.from('quick_scan_leads').select('id', { count: 'exact', head: true }).then(r => r).catch(() => ({ count: 0, data: null, error: null })),

    // Quick scans afgelopen 7 dagen
    admin.from('quick_scan_leads').select('id', { count: 'exact', head: true }).gte('created_at', zevenDagenGeleden).then(r => r).catch(() => ({ count: 0, data: null, error: null })),
  ])

  // Plan breakdown berekenen
  const planCounts: Record<string, number> = { free: 0, one_time: 0, monthly: 0, yearly: 0 }
  for (const p of planVerdeling.data ?? []) {
    const plan = p.plan ?? 'free'
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }

  const betaald = (planCounts.one_time ?? 0) + (planCounts.monthly ?? 0) + (planCounts.yearly ?? 0)
  const totaal = totaalGebruikers.count ?? 0
  const conversieRate = totaal > 0 ? Math.round((betaald / totaal) * 100) : 0

  // Risico breakdown
  const risicoCounts: Record<string, number> = { laag: 0, gemiddeld: 0, hoog: 0 }
  for (const a of risicoVerdeling.data ?? []) {
    const label = a.overall_risk_label ?? 'onbekend'
    risicoCounts[label] = (risicoCounts[label] ?? 0) + 1
  }

  const quickScanTotaal = totaalQuickScans.count ?? 0
  const quickScanNaarRegistratie = quickScanTotaal > 0
    ? Math.round((totaal / quickScanTotaal) * 100)
    : 0

  return NextResponse.json({
    quickScans: {
      totaal: quickScanTotaal,
      dezeWeek: quickScansDezeWeek.count ?? 0,
      naarRegistratieRate: quickScanNaarRegistratie,
    },
    gebruikers: {
      totaal,
      nieuwDezeWeek: nieuwDezeWeek.count ?? 0,
      betaald,
      conversieRate,
      perPlan: planCounts,
    },
    analyses: {
      totaal: totaalAnalyses.count ?? 0,
      dezeWeek: analysesDezeWeek.count ?? 0,
      perRisico: risicoCounts,
    },
  })
  } catch (err) {
    console.error('[admin/stats] onverwachte fout:', err)
    return NextResponse.json({ error: 'Interne fout' }, { status: 500 })
  }
}
