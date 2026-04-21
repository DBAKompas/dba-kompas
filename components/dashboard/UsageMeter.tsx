'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react'

type UsageSnapshot = {
  plan: 'free' | 'monthly' | 'yearly' | 'one_time'
  used: number
  limit: number
  remaining: number
  percentage: number
  warn: boolean
  atLimit: boolean
}

const PLAN_LABELS: Record<UsageSnapshot['plan'], string> = {
  free:     'Geen actief plan',
  monthly:  'Maandabonnement',
  yearly:   'Jaarabonnement',
  one_time: 'Eenmalige check',
}

export function UsageMeter() {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: UsageSnapshot | null) => {
        setSnapshot(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !snapshot) return null
  if (snapshot.plan === 'free') {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Geen actief plan
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kies een abonnement of eenmalige check om DBA-analyses uit te voeren.
            </p>
          </div>
          <Link
            href="/upgrade"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Bekijk plannen
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  const barColor = snapshot.atLimit
    ? 'bg-red-500'
    : snapshot.warn
      ? 'bg-amber-500'
      : 'bg-emerald-500'

  const periodLabel =
    snapshot.plan === 'one_time' ? 'totaal' : 'deze maand'

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Verbruik {periodLabel}
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {snapshot.used}
            <span className="text-base font-medium text-muted-foreground"> / {snapshot.limit}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {PLAN_LABELS[snapshot.plan]}
          </p>
        </div>
        {snapshot.warn && !snapshot.atLimit && (
          <AlertTriangle className="size-5 shrink-0 text-amber-500" aria-hidden />
        )}
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${barColor}`}
          style={{ width: `${snapshot.percentage}%` }}
          role="progressbar"
          aria-valuenow={snapshot.used}
          aria-valuemin={0}
          aria-valuemax={snapshot.limit}
          aria-label={`${snapshot.used} van ${snapshot.limit} analyses gebruikt`}
        />
      </div>

      {snapshot.warn && !snapshot.atLimit && (
        <p className="mt-3 text-xs text-amber-700">
          Je hebt bijna je credits gebruikt voor {periodLabel === 'totaal' ? 'deze check' : 'deze maand'} (nog {snapshot.remaining} over).
        </p>
      )}

      {snapshot.atLimit && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-red-50 p-3">
          <p className="text-xs text-red-800">
            Je hebt het maximum van {snapshot.limit} analyses bereikt. Resetdatum: de 1e van volgende maand.
          </p>
          {snapshot.plan !== 'yearly' && (
            <Link
              href="/upgrade"
              className="shrink-0 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
            >
              Upgraden
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
