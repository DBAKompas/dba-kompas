'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UsageMeter } from '@/components/dashboard/UsageMeter'
import { NoAccessView } from './NoAccessView'
import { FileSearch, Loader2, CheckCircle, X } from 'lucide-react'

interface Stats {
  totalAssessments: number
  dbaProofCount: number
  newUpdates: number
  unreadNotifications: number
}

interface LatestAssessment {
  id: string
  overall_risk_label: string | null
  overall_summary: string | null
  top_improvements: string[] | null
  created_at: string
}

interface NewsPreview {
  id: string
  title: string
  source: string | null
  published_at: string
}

type AccessStatus = 'loading' | 'has_access' | 'no_access'

function riskStyle(label: string | null) {
  switch (label?.toLowerCase()) {
    case 'laag':
      return { text: 'Laag risico', cls: 'bg-emerald-100 text-emerald-700' }
    case 'hoog':
      return { text: 'Hoog risico', cls: 'bg-red-100 text-red-700' }
    default:
      return { text: 'Gemiddeld risico', cls: 'bg-amber-100 text-amber-700' }
  }
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successType, setSuccessType] = useState<'subscription' | 'one_time' | null>(null)

  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading')
  const [availableCodes, setAvailableCodes] = useState(0)
  const [plan, setPlan] = useState<string | null>(null)
  const [latest, setLatest] = useState<LatestAssessment | null>(null)
  const [news, setNews] = useState<NewsPreview[]>([])

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

  // Access-check + codes parallel ophalen. UI-only: server-side endpoints
  // blokkeren bij /analyse en /nieuws alsnog op quota.
  useEffect(() => {
    Promise.all([
      fetch('/api/user/quota').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/one-time/entitlement').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/referral/code').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([quotaResp, entResp, refResp]) => {
        const plan: string | null = quotaResp?.quotaPlan ?? null
        const hasEntitlement: boolean = entResp?.hasEntitlement === true

        const hasAccess =
          plan === 'admin' ||
          plan === 'monthly' ||
          plan === 'yearly' ||
          (plan === 'one_time' && hasEntitlement)

        setPlan(plan)
        setAccessStatus(hasAccess ? 'has_access' : 'no_access')

        if (refResp?.codes && Array.isArray(refResp.codes)) {
          setAvailableCodes(
            refResp.codes.filter((c: { isUsed: boolean }) => !c.isUsed).length
          )
        }
      })
      .catch(() => {
        // Failsafe: bij netwerkfout val terug op has_access om betalende
        // gebruikers niet onterecht te blokkeren. De daadwerkelijke
        // gating gebeurt server-side bij /analyse en /nieuws.
        setAccessStatus('has_access')
      })
  }, [])

  useEffect(() => {
    if (accessStatus !== 'has_access') return
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Laatste analyse. Best-effort: bij een fout blijft het blok leeg.
    fetch('/api/dba/assessments')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) setLatest(rows[0])
      })
      .catch(() => {})
  }, [accessStatus])

  // Nieuws hoort bij een abonnement, niet bij een eenmalige check.
  const showNews = plan === 'admin' || plan === 'monthly' || plan === 'yearly'
  useEffect(() => {
    if (accessStatus !== 'has_access' || !showNews) return
    fetch('/api/news?limit=3')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (Array.isArray(rows)) setNews(rows.slice(0, 3))
      })
      .catch(() => {})
  }, [accessStatus, showNews])

  // Laad-state tijdens access-check
  if (accessStatus === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Geen actieve toegang: welkom-terug view met upgrade- en referral-route
  if (accessStatus === 'no_access') {
    return <NoAccessView availableCodes={availableCodes} />
  }

  // Heeft toegang: overzicht dat begint met de volgende stap
  const risk = latest ? riskStyle(latest.overall_risk_label) : null
  const actions = (latest?.top_improvements ?? []).slice(0, 2)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overzicht</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toets een nieuwe opdracht of ga verder met je laatste analyse.
        </p>
      </div>

      {/* Betaal-succes banner */}
      {showSuccess && (
        <div className="relative flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-medium">
              {successType === 'one_time' ? 'Je check staat klaar' : 'Je abonnement is actief'}
            </p>
            <p className="mt-0.5 text-sm text-green-700">
              {successType === 'one_time'
                ? 'Je kunt nu je opdracht toetsen.'
                : 'Hieronder zie je hoeveel checks je deze maand nog kunt doen.'}
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

      {/* Eerste actie: nieuwe opdracht toetsen */}
      <div className="rounded-xl bg-primary p-6 sm:p-8 text-primary-foreground">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold leading-tight">Nieuwe opdracht toetsen</h2>
            <p className="text-sm text-primary-foreground/80 max-w-md">
              Plak je opdrachtomschrijving of upload een PDF of Word-bestand. De uitkomst is er meestal binnen een minuut.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/analyse">
              <FileSearch className="size-4" />
              Start een analyse
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Laatste analyse */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-3 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Je laatste analyse</h2>
            {latest && (
              <span className="text-xs text-muted-foreground">
                {new Date(latest.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          {loading && !latest ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : latest && risk ? (
            <div className="mt-4 space-y-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${risk.cls}`}>
                {risk.text}
              </span>
              {latest.overall_summary && (
                <p className="text-sm text-foreground/80 line-clamp-4">{latest.overall_summary}</p>
              )}
              {actions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Om te bespreken</p>
                  {actions.map((action, i) => (
                    <p key={i} className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm line-clamp-3">
                      {action}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm font-medium">
                <Link href={`/analyse/${latest.id}`} className="text-primary underline underline-offset-4">
                  Open analyse en opdrachtbrief
                </Link>
                <Link href="/analyse?tab=eerder" className="text-muted-foreground underline underline-offset-4">
                  Alle analyses{stats ? ` (${stats.totalAssessments})` : ''}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Je hebt nog geen opdracht getoetst. Na je eerste analyse zie je hier de uitkomst en de punten om te bespreken.
              </p>
              <Link href="/analyse" className="text-sm font-medium text-primary underline underline-offset-4">
                Toets je eerste opdracht
              </Link>
            </div>
          )}
        </div>

        {/* Rechterkolom */}
        <div className="space-y-6 lg:col-span-2 min-w-0">
          <UsageMeter />

          {showNews && news.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Laatste nieuws</h2>
                {stats && stats.newUpdates > 0 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-foreground">
                    {stats.newUpdates} nieuw
                  </span>
                )}
              </div>
              <ul className="mt-3 divide-y divide-border">
                {news.map((item) => (
                  <li key={item.id} className="py-2.5">
                    <Link href="/nieuws" className="block text-sm font-medium hover:underline line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {shortDate(item.published_at)}
                      {item.source ? `, ${item.source}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="/nieuws" className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4">
                Al het nieuws
              </Link>
            </div>
          )}

          {stats && stats.unreadNotifications > 0 && (
            <Link
              href="/notificaties"
              className="block rounded-xl border border-border bg-card p-5 text-sm hover:bg-muted/40 transition-colors"
            >
              <span className="font-semibold">
                {stats.unreadNotifications} ongelezen {stats.unreadNotifications === 1 ? 'melding' : 'meldingen'}
              </span>
              <span className="block text-muted-foreground mt-0.5">Bekijk wat er nieuw is voor jouw analyses.</span>
            </Link>
          )}

          {availableCodes > 0 && (
            <Link
              href="/beloningen"
              className="block rounded-xl border border-border bg-card p-5 text-sm hover:bg-muted/40 transition-colors"
            >
              <span className="font-semibold">Deel DBA Kompas en verdien een gratis analyse</span>
              <span className="block text-muted-foreground mt-0.5">
                Je hebt nog {availableCodes} {availableCodes === 1 ? 'code' : 'codes'} om te delen. Wie jouw code gebruikt krijgt 20% korting.
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
