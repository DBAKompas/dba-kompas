'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Users, Mail, FileSearch, TrendingUp, ArrowRight } from 'lucide-react'

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

const tiles = [
  {
    href: '/admin/gebruikers',
    title: 'Gebruikers',
    description: 'Bekijk alle geregistreerde gebruikers, hun abonnement en rol.',
    icon: <Users className="size-5" />,
  },
  {
    href: '/admin/analyses',
    title: 'Analyses',
    description: 'Overzicht van alle DBA-analyses per gebruiker.',
    icon: <FileSearch className="size-5" />,
  },
  {
    href: '/admin/emails',
    title: 'E-mails',
    description: 'Beheer e-mailtemplates en stuur handmatige digest-mails.',
    icon: <Mail className="size-5" />,
  },
]

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
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
          else console.error('[admin] stats API fout:', data)
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
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Control Tower</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overzicht van DBA Kompas</p>
      </div>

      {/* Statcards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-8 w-12 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : s ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Gebruikers totaal" value={s.gebruikers.totaal} sub={`+${s.gebruikers.nieuwDezeWeek} deze week`} />
          <StatCard label="Betaald" value={s.gebruikers.betaald} sub={`${s.gebruikers.conversieRate}% conversie`} />
          <StatCard label="Analyses totaal" value={s.analyses.totaal} sub={`+${s.analyses.dezeWeek} deze week`} />
          <StatCard label="Conversie" value={`${s.gebruikers.conversieRate}%`} sub={`${s.gebruikers.betaald} van ${s.gebruikers.totaal}`} />
        </div>
      ) : null}

      {/* Funnel */}
      {s && (
        <Card className="border-border/50 mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">

              {/* Stap 1: Quick Scan */}
              <div className="flex-1 min-w-[100px] rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">{s.quickScans.totaal}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Quick scans</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">+{s.quickScans.dezeWeek} deze week</p>
              </div>

              <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />

              {/* Stap 2: Registraties */}
              <div className="flex-1 min-w-[100px] rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">{s.gebruikers.totaal}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Registraties</p>
                {s.quickScans.totaal > 0 && (
                  <p className="text-xs text-primary font-medium mt-0.5">{s.quickScans.naarRegistratieRate}%</p>
                )}
              </div>

              <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />

              {/* Stap 3: Betaald */}
              <div className="flex-1 min-w-[100px] rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">{s.gebruikers.betaald}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Betaald</p>
                <p className="text-xs text-primary font-medium mt-0.5">{s.gebruikers.conversieRate}%</p>
              </div>

              <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />

              {/* Stap 4: Analyses */}
              <div className="flex-1 min-w-[100px] rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">{s.analyses.totaal}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Analyses</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">+{s.analyses.dezeWeek} deze week</p>
              </div>

              <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />

              {/* Stap 5: Risico breakdown */}
              <div className="flex-1 min-w-[140px] rounded-lg bg-muted/50 border border-border/50 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1.5">Risico-uitkomsten</p>
                {Object.entries(RISICO_LABELS).map(([key, { label, kleur }]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className={kleur}>{label}</span>
                    <span className="font-medium text-foreground">{s.analyses.perRisico[key] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan breakdown */}
            <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-4 gap-2">
              {Object.entries(PLAN_LABELS).map(([key, label]) => (
                <div key={key} className="text-center">
                  <p className="text-lg font-bold text-foreground">{s.gebruikers.perPlan[key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigatietegels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="border-border/50 hover:border-border transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-base">
                  <span className="text-muted-foreground">{tile.icon}</span>
                  {tile.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{tile.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
