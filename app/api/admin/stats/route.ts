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
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', zevenDagenGeleden),
    supabaseAdmin.from('profiles').select('plan'),
    supabaseAdmin.from('dba_assessments').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('dba_assessments').select('id', { count: 'exact', head: true }).gte('created_at', zevenDagenGeleden),
    supabaseAdmin.from('dba_assessments').select('overall_risk_label'),
    supabaseAdmin.from('quick_scan_leads').select('id', { count: 'exact', head: true }).then(r => r).catch(() => ({ count: 0 })),
    supabaseAdmin.from('quick_scan_leads').select('id', { count: 'exact', head: true }).gte('created_at', zevenDagenGeleden).then(r => r).catch(() => ({ count: 0 })),
  ])

  const planCounts: Record<string, number> = { free: 0, one_time: 0, monthly: 0, yearly: 0 }
  for (const p of planVerdeling.data ?? []) {
    const plan = p.plan ?? 'free'
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }

  const betaald = (planCounts.one_time ?? 0) + (planCounts.monthly ?? 0) + (planCounts.yearly ?? 0)
  const totaal = totaalGebruikers.count ?? 0
  const conversieRate = totaal > 0 ? Math.round((betaald / totaal) * 100) : 0

  const risicoCounts: Record<string, number> = { laag: 0, gemiddeld: 0, hoog: 0 }
  for (const a of risicoVerdeling.data ?? []) {
    const label = a.overall_risk_label ?? 'onbekend'
    risicoCounts[label] = (risicoCounts[label] ?? 0) + 1
  }

  const quickScanTotaal = totaalQuickScans.count ?? 0

  return NextResponse.json({
    quickScans: {
      totaal: quickScanTotaal,
      dezeWeek: quickScansDezeWeek.count ?? 0,
      naarRegistratieRate: quickScanTotaal > 0 ? Math.round((totaal / quickScanTotaal) * 100) : 0,
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
}
