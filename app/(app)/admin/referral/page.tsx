'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthContext'
import {
  Loader2, ArrowLeft, Users, Gift, TrendingUp, Share2, CheckCircle, Clock, AlertCircle
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Totals {
  totalCodes: number
  totalTracked: number
  totalConverted: number
  conversionRate: number
  totalRewards: number
}

interface TopReferrer {
  userId: string
  email: string
  code: string
  qualifiedCount: number
  milestones: number[]
}

interface ActivityItem {
  id: string
  referredEmail: string
  referrerEmail: string
  referralCode: string
  status: 'pending' | 'qualified' | 'rewarded'
  purchase: string | null
  createdAt: string
}

interface WeekPoint {
  week: string
  count: number
}

interface ReferralData {
  totals: Totals
  topReferrers: TopReferrer[]
  recentActivity: ActivityItem[]
  weekTrend: WeekPoint[]
}

// ── Hulpfuncties ─────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatWeek(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${d.toLocaleDateString('nl-NL', { month: 'short' })}`
}

function StatusBadge({ status }: { status: ActivityItem['status'] }) {
  const map = {
    pending:   { label: 'Wacht op betaling', color: 'bg-amber-100 text-amber-700', icon: Clock },
    qualified: { label: 'Gekwalificeerd', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    rewarded:  { label: 'Beloond', color: 'bg-emerald-100 text-emerald-700', icon: Gift },
  }
  const { label, color, icon: Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      <Icon className="size-3" />{label}
    </span>
  )
}

function MilestoneBadge({ milestone }: { milestone: number }) {
  const label = milestone === 1 ? '1×' : milestone === 3 ? '3×' : milestone === 5 ? '5×' : `${milestone}×`
  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
      {label}
    </span>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconColor = 'text-muted-foreground',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconColor?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ── TrendBar ─────────────────────────────────────────────────────────────────

function TrendBars({ data }: { data: WeekPoint[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-foreground mb-4">Gekwalificeerde doorverwijzingen per week</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((point) => {
          const pct = Math.round((point.count / max) * 100)
          return (
            <div key={point.week} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-medium">
                {point.count > 0 ? point.count : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '96px' }}>
                <div
                  className="w-full rounded-t-md bg-violet-500 transition-all"
                  style={{ height: pct > 0 ? `${Math.max(pct, 4)}%` : '4px', opacity: pct > 0 ? 1 : 0.15 }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                {formatWeek(point.week)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────

export default function AdminReferralPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<ReferralData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user && !isAdmin) router.push('/dashboard')
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (!loading && isAdmin) {
      fetch('/api/admin/referral')
        .then(r => r.json())
        .then(d => setData(d))
        .catch(console.error)
        .finally(() => setDataLoading(false))
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

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="size-3.5" /> Control Tower
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Referral overzicht</h1>
        <p className="text-sm text-muted-foreground mt-1">Doorverwijzingen, conversies en beloningen in één oogopslag</p>
      </div>

      {dataLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" /> Laden...
        </div>
      ) : !data ? (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="size-4" /> Kon data niet laden
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label="Actieve codes"
              value={data.totals.totalCodes}
              sub="unieke referrers"
              icon={Share2}
              iconColor="text-violet-500"
            />
            <StatCard
              label="Doorverwijzingen"
              value={data.totals.totalTracked}
              sub="incl. wachtend"
              icon={Users}
              iconColor="text-blue-500"
            />
            <StatCard
              label="Gekwalificeerd"
              value={data.totals.totalConverted}
              sub="na betaling"
              icon={CheckCircle}
              iconColor="text-emerald-500"
            />
            <StatCard
              label="Conversieratio"
              value={`${data.totals.conversionRate}%`}
              sub="betaald / totaal"
              icon={TrendingUp}
              iconColor="text-amber-500"
            />
            <StatCard
              label="Rewards uitgekeerd"
              value={data.totals.totalRewards}
              sub="mijlpalen bereikt"
              icon={Gift}
              iconColor="text-pink-500"
            />
          </div>

          {/* Weektrend */}
          <TrendBars data={data.weekTrend} />

          {/* Top referrers */}
          {data.topReferrers.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Top referrers</p>
                <p className="text-xs text-muted-foreground mt-0.5">Gesorteerd op gekwalificeerde doorverwijzingen</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">#</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Gebruiker</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Code</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Gekwalificeerd</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Mijlpalen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topReferrers.map((ref, i) => (
                      <tr key={ref.userId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 text-muted-foreground font-medium">{i + 1}</td>
                        <td className="px-5 py-3.5 font-medium">{ref.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">{ref.code}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-foreground">{ref.qualifiedCount}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            {ref.milestones.length > 0
                              ? ref.milestones.map(m => <MilestoneBadge key={m} milestone={m} />)
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recente activiteit */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Recente activiteit</p>
              <p className="text-xs text-muted-foreground mt-0.5">Laatste 20 doorverwijzingen — wie verwees wie en wat er gekocht is</p>
            </div>
            {data.recentActivity.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nog geen doorverwijzingen geregistreerd.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Datum</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Verwezen door</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Nieuwe gebruiker</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Aankoop</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivity.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap text-xs">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-medium">{item.referrerEmail}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{item.referralCode}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-foreground">{item.referredEmail}</td>
                        <td className="px-5 py-3.5">
                          {item.purchase ? (
                            <span className="text-xs font-medium text-foreground">{item.purchase}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nog geen aankoop</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
