'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import { Loader2, ArrowRight, TrendingUp } from 'lucide-react'

type Stats = {
  quickScans: {
    totaal: number
    dezeWeek: number
    naarRegistratieRate: number
  }
  gebruikers: {
    totaal: number
    nieuwDezeWeek: number
    betaald: number
    conversieRate: number
    perPlan: Record<string, number>
  }
  analyses: {
    totaal: number
    dezeWeek: number
    perRisico: Record<string, number>
  }
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  one_time: 'Eenmalig',
  monthly: 'Maand',
  yearly: 'Jaar',
}

const RISICO_LABELS: Record<string, { label: string; kleur: string }> = {
  laag:      { label: 'Laag risico',      kleur: 'text-emerald-600' },
  gemiddeld: { label: 'Gemiddeld risico', kleur: 'text-amber-600' },
  hoog:      { label: 'Hoog risico',      kleur: 'text-red-600' },
}

function ConvStap({
  waarde,
  label,
  sub,
  rate,
}: {
  waarde: number
  label: string
  sub?: string
  rate?: string
}) {
  return (
    <div className="flex-1 min-w-[110px] rounded-xl bg-muted/50 border border-border px-4 py-4 text-center">
      <p className="text-3xl font-bold text-foreground">{waarde}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
      {rate && <p className="text-xs text-primary font-semibold mt-1">{rate}</p>}
    </div>
  )
}

export default function FunnelPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user && !isAdmin) router.push('/dashboard')
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (!loading && isAdmin) {
      fetch('/api/admin/stats')
        .then(r => r.json())
        .then(data => {
          if (data?.gebruikers) setStats(data)
          else console.error('[funnel] stats API fout:', data)
        })
        .catch(console.error)
        .finally(() => setStatsLoading(false))
    }
  }, [loading, isAdmin])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) return null

  const s = stats

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Funnel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Van quick scan tot betaalde analyse — conversie per stap
        </p>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : s ? (
        <>
          {/* Hoofd funnel */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Conversie per stap</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ConvStap
                waarde={s.quickScans.totaal}
                label="Quick scans"
                sub={`+${s.quickScans.dezeWeek} deze week`}
              />
              <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />
              <ConvStap
                waarde={s.gebruikers.totaal}
                label="Registraties"
                sub={`+${s.gebruikers.nieuwDezeWeek} deze week`}
                rate={s.quickScans.totaal > 0 ? `${s.quickScans.naarRegistratieRate}% conv.` : undefined}
              />
              <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />
              <ConvStap
                waarde={s.gebruikers.betaald}
                label="Betaald"
                rate={`${s.gebruikers.conversieRate}% conv.`}
              />
              <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />
              <ConvStap
                waarde={s.analyses.totaal}
                label="Analyses"
                sub={`+${s.analyses.dezeWeek} deze week`}
              />
            </div>
          </div>

          {/* Plan + Risico breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-4">Abonnementen</h2>
              <div className="space-y-3">
                {Object.entries(PLAN_LABELS).map(([key, label]) => {
                  const aantal = s.gebruikers.perPlan[key] ?? 0
                  const totaal = s.gebruikers.totaal
                  const pct = totaal > 0 ? Math.round((aantal / totaal) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground">
                          {aantal} <span className="text-muted-foreground/60 text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-4">Risico-uitkomsten analyses</h2>
              <div className="space-y-3">
                {Object.entries(RISICO_LABELS).map(([key, { label, kleur }]) => {
                  const aantal = s.analyses.perRisico[key] ?? 0
                  const totaal = s.analyses.totaal
                  const pct = totaal > 0 ? Math.round((aantal / totaal) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={kleur}>{label}</span>
                        <span className="font-medium text-foreground">
                          {aantal} <span className="text-muted-foreground/60 text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            key === 'laag' ? 'bg-emerald-500/60' :
                            key === 'gemiddeld' ? 'bg-amber-500/60' :
                            'bg-red-500/60'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Conversie samenvatting */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold mb-4">Conversie samenvatting</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-muted-foreground text-xs mb-1">Quick scan → Registratie</p>
                <p className="text-2xl font-bold text-foreground">
                  {s.quickScans.totaal > 0 ? `${s.quickScans.naarRegistratieRate}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {s.gebruikers.totaal} van {s.quickScans.totaal}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-muted-foreground text-xs mb-1">Registratie → Betaald</p>
                <p className="text-2xl font-bold text-foreground">{s.gebruikers.conversieRate}%</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {s.gebruikers.betaald} van {s.gebruikers.totaal}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-muted-foreground text-xs mb-1">Betaald → Analyse gedaan</p>
                <p className="text-2xl font-bold text-foreground">
                  {s.gebruikers.betaald > 0
                    ? `${Math.round((s.analyses.totaal / s.gebruikers.betaald) * 100)}%`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {s.analyses.totaal} analyses door {s.gebruikers.betaald} betaald
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Kon statistieken niet laden.</p>
      )}
    </div>
  )
}
