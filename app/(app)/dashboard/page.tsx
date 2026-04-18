'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  FileSearch,
  ShieldCheck,
  Newspaper,
  Bell,
  ArrowRight,
  Loader2,
  CheckCircle,
  X,
} from 'lucide-react'

interface Stats {
  totalAssessments: number
  dbaProofCount: number
  newUpdates: number
  unreadNotifications: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successType, setSuccessType] = useState<'subscription' | 'one_time' | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const oneTime = searchParams.get('one_time')

    if (sessionId) {
      setShowSuccess(true)
      setSuccessType(oneTime === 'success' ? 'one_time' : 'subscription')

      const url = new URL(window.location.href)
      url.searchParams.delete('session_id')
      url.searchParams.delete('one_time')
      router.replace(url.pathname + (url.search || ''), { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const statCards = [
    {
      title: 'Totaal Analyses',
      value: stats?.totalAssessments ?? 0,
      icon: FileSearch,
      color: 'text-blue-500',
    },
    {
      title: 'DBA-proof',
      value: stats?.dbaProofCount ?? 0,
      icon: ShieldCheck,
      color: 'text-emerald-500',
    },
    {
      title: 'Nieuws Updates',
      value: stats?.newUpdates ?? 0,
      icon: Newspaper,
      color: 'text-amber-500',
    },
    {
      title: 'Ongelezen Notificaties',
      value: stats?.unreadNotifications ?? 0,
      icon: Bell,
      color: 'text-red-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overzicht van uw DBA analyses en updates</p>
      </div>

      {/* Betaal-succes banner */}
      {showSuccess && (
        <div className="relative flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-medium">
              {successType === 'one_time'
                ? 'Eenmalige analyse geactiveerd!'
                : 'Abonnement geactiveerd!'}
            </p>
            <p className="mt-0.5 text-sm text-green-700">
              {successType === 'one_time'
                ? 'Uw DBA-analyse credit is gereed. Start direct een nieuwe analyse.'
                : 'Uw Pro-abonnement is actief. U kunt nu onbeperkt analyses uitvoeren.'}
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="shrink-0 rounded p-0.5 text-green-600 hover:bg-green-100"
            aria-label="Sluiten"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.title}
              </p>
              <div className="mt-3 flex items-end justify-between">
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-3xl font-bold">{stat.value}</span>
                )}
                <Icon className={`size-5 ${stat.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Start nieuwe analyse</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload een overeenkomst of plak tekst om te controleren op DBA-compliance
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/analyse">
              <FileSearch className="size-4" />
              Nieuwe analyse starten
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Eerdere analyses */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Eerdere analyses</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bekijk uw eerder uitgevoerde analyses en resultaten
        </p>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/analyse">
              Bekijk alle analyses
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
