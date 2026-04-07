'use client'

import { useEffect, useState } from 'react'
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
