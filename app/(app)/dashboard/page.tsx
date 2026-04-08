'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
    // Detect successful checkout return
    const sessionId = searchParams.get('session_id')
    const oneTime = searchParams.get('one_time')

    if (sessionId) {
      setShowSuccess(true)
      setSuccessType(oneTime === 'success' ? 'one_time' : 'subscription')

      // Clean up URL without re-render
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
      color: 'text-blue-600',
    },
    {
      title: 'DBA-proof',
      value: stats?.dbaProofCount ?? 0,
      icon: ShieldCheck,
      color: 'text-green-600',
    },
    {
      title: 'Nieuws Updates',
      value: stats?.newUpdates ?? 0,
      icon: Newspaper,
      color: 'text-amber-600',
    },
    {
      title: 'Ongelezen Notificaties',
      value: stats?.unreadNotifications ?? 0,
      icon: Bell,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overzicht van uw DBA analyses en updates</p>
      </div>

      {/* Betaal-succes banner */}
      {showSuccess && (
        <div className="relative flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
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
            <Card key={stat.title}>
              <CardHeader>
                <CardDescription>{stat.title}</CardDescription>
                <CardTitle className="flex items-center justify-between">
                  {loading ? (
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-2xl">{stat.value}</span>
                  )}
                  <Icon className={`size-5 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* CTA Card */}
      <Card>
        <CardHeader>
          <CardTitle>Start nieuwe analyse</CardTitle>
          <CardDescription>
            Upload een overeenkomst of plak tekst om te controleren op DBA-compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/analyse">
                <FileSearch className="size-4" />
                Nieuwe analyse starten
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent analyses link */}
      <Card>
        <CardHeader>
          <CardTitle>Eerdere analyses</CardTitle>
          <CardDescription>
            Bekijk uw eerder uitgevoerde analyses en resultaten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/analyse">
              Bekijk alle analyses
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
