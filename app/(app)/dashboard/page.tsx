'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { UsageMeter } from '@/components/dashboard/UsageMeter'
import { NoAccessView } from './NoAccessView'
import { Loader2, CheckCircle, X } from 'lucide-react'

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

// Zelfde scores en kleuren als op de analysepagina (app/(app)/analyse/[id]).
function riskStyle(label: string | null) {
  switch (label?.toLowerCase()) {
    case 'laag':
      return { text: 'Laag risico', short: 'laag', score: 88, color: '#1f9d6b' }
    case 'hoog':
      return { text: 'Hoog risico', short: 'hoog', score: 25, color: '#d2493a' }
    default:
      return { text: 'Gemiddeld risico', short: 'gemiddeld', score: 55, color: '#d99a1c' }
  }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Goedenacht'
  if (h < 12) return 'Goedemorgen'
  if (h < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

const cardLabel = 'text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3.5'

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
  const [qualified, setQualified] = useState(0)
  const [firstName, setFirstName] = useState('')

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

        if (typeof refResp?.qualifiedCount === 'number') setQualified(refResp.qualifiedCount)
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

    // Voornaam voor de begroeting. Best-effort.
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const name: unknown = d?.name ?? d?.profile?.name
        if (typeof name === 'string' && name.trim() && !name.includes('@') && !name.includes('.')) {
          setFirstName(name.trim().split(/\s+/)[0])
        }
      })
      .catch(() => {})

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
  const nextMilestone = [1, 3, 5].find((m) => m > qualified) ?? null
  const ring = 2 * Math.PI * 55

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {latest && risk
            ? `Je laatste opdracht scoort ${risk.short}.${
                actions.length > 0
                  ? ` Er ${actions.length === 1 ? 'staat één actiepunt' : `staan ${actions.length === 2 ? 'twee' : actions.length} actiepunten`} open.`
                  : ''
              }`
            : 'Toets je eerste opdracht en zie binnen een minuut waar die vragen oproept.'}
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
                : 'In het menu zie je hoeveel checks je deze maand hebt gedaan.'}
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

      {/* Verbruik: op desktop staat dit in het menu */}
      <div className="md:hidden">
        <UsageMeter />
      </div>

      {/* Eerste actie: nieuwe opdracht toetsen */}
      <div
        className="grid items-center gap-6 p-7 sm:p-9 text-white sm:grid-cols-[1fr_auto]"
        style={{
          backgroundColor: '#0b1d3a',
          borderRadius: '40px 40px 40px 10px',
          backgroundImage: 'radial-gradient(500px 240px at 100% 0, rgba(212,120,42,.35), transparent 70%)',
        }}
      >
        <div className="min-w-0">
          <h2 className="text-[26px] font-bold leading-tight tracking-tight">Nieuwe opdracht toetsen</h2>
          <p className="mt-1.5 text-[15px] text-[#b9c6da]">
            Plak je tekst of upload een PDF of Word-bestand. Uitkomst binnen een minuut.
          </p>
          <Link
            href="/analyse"
            className="mt-4 block rounded-[14px] border-[1.5px] border-dashed border-white/30 bg-white/[0.04] p-[18px] text-[14.5px] text-[#93a4bf] transition-colors hover:border-white/50 hover:text-white"
          >
            Plak hier je opdrachtomschrijving…
          </Link>
        </div>
        <Link
          href="/analyse"
          className="inline-flex items-center justify-center rounded-full bg-accent px-[26px] py-3.5 text-base font-bold text-white shadow-[0_10px_30px_-8px_rgba(212,120,42,.65)] transition-transform hover:-translate-y-0.5"
        >
          Analyseer
        </Link>
      </div>

      <div className="grid gap-[18px] lg:grid-cols-[1.25fr_1fr]">
        {/* Laatste analyse */}
        <div className="min-w-0 rounded-[18px] border border-border bg-white p-6">
          <h4 className={cardLabel}>Laatste analyse</h4>

          {loading && !latest ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : latest && risk ? (
            <>
              <div className="grid items-center gap-5 sm:grid-cols-[110px_1fr]">
                <div className="relative size-[110px]">
                  <svg width="110" height="110" viewBox="0 0 132 132" className="-rotate-90" aria-hidden="true">
                    <circle cx="66" cy="66" r="55" fill="none" strokeWidth="11" stroke="#efe9de" />
                    <circle
                      cx="66"
                      cy="66"
                      r="55"
                      fill="none"
                      strokeWidth="11"
                      strokeLinecap="round"
                      stroke={risk.color}
                      strokeDasharray={ring}
                      strokeDashoffset={ring - (ring * risk.score) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <strong className="text-[25px] leading-none tracking-tight">{risk.score}%</strong>
                    <small className="mt-[3px] text-[11px] font-semibold text-muted-foreground">{risk.short}</small>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold">{risk.text}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                    {latest.overall_summary ?? 'Open de analyse voor de uitkomst per onderdeel.'}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground/70">
                    {new Date(latest.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {actions.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {actions.map((action, i) => (
                    <div key={i} className="rounded-[10px] border border-[#f4dcc0] bg-[#fff7ee] px-3 py-2.5 text-sm">
                      <b className="text-accent">{i + 1}.</b> <span className="line-clamp-3 inline">{action}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1">
                <Link href={`/analyse/${latest.id}`} className="text-[13.5px] font-bold text-accent hover:underline">
                  Open analyse en herschreven opdrachtbrief
                </Link>
                <Link href="/analyse?tab=eerder" className="text-[13.5px] font-bold text-muted-foreground hover:underline">
                  Alle analyses{stats ? ` (${stats.totalAssessments})` : ''}
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Je hebt nog geen opdracht getoetst. Na je eerste analyse zie je hier de uitkomst en de punten om te bespreken.
              </p>
              <Link href="/analyse" className="text-[13.5px] font-bold text-accent hover:underline">
                Toets je eerste opdracht
              </Link>
            </div>
          )}
        </div>

        {/* Rechterkolom */}
        <div className="grid min-w-0 content-start gap-[18px]">
          {showNews && news.length > 0 && (
            <div className="rounded-[18px] border border-border bg-white p-6">
              <h4 className={cardLabel}>Laatste nieuws</h4>
              <div className="grid gap-2">
                {news.map((item) => (
                  <Link
                    key={item.id}
                    href="/nieuws"
                    className="flex items-baseline gap-2.5 rounded-[10px] bg-[#f7f3ec] px-3 py-2.5 text-[13.5px] hover:bg-[#f1ebe0]"
                  >
                    <time className="shrink-0 whitespace-nowrap text-[11.5px] font-bold text-accent">
                      {shortDate(item.published_at)}
                    </time>
                    <span className="line-clamp-2">{item.title}</span>
                  </Link>
                ))}
              </div>
              <Link href="/nieuws" className="mt-3.5 inline-block text-[13.5px] font-bold text-accent hover:underline">
                Alle updates
              </Link>
            </div>
          )}

          <div className="rounded-[18px] border border-border bg-white p-6">
            <h4 className={cardLabel}>Stand van de regels</h4>
            <div className="grid gap-2.5 text-sm">
              <div className="flex items-start gap-3">
                <i className="mt-[7px] size-[9px] shrink-0 rounded-full bg-[#1f9d6b]" />
                Handhaving actief sinds 1 januari 2025
              </div>
              <div className="flex items-start gap-3">
                <i className="mt-[7px] size-[9px] shrink-0 rounded-full bg-[#d99a1c]" />
                2026: vergrijpboetes mogelijk, geen verzuimboetes
              </div>
            </div>
            <a
              href="https://dbakompas.nl/kennisbank/handhaving-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 inline-block text-[13.5px] font-bold text-accent hover:underline"
            >
              Lees hoe er nu gehandhaafd wordt
            </a>
          </div>

          <div className="rounded-[18px] border border-border bg-white p-6">
            <h4 className={cardLabel}>Deel en verdien</h4>
            <p className="text-[14.5px]">
              {nextMilestone ? (
                <>
                  Nog <b>{nextMilestone - qualified} {nextMilestone - qualified === 1 ? 'doorverwijzing' : 'doorverwijzingen'}</b> voor{' '}
                  {nextMilestone === 1 ? 'een gratis analyse' : 'je volgende beloning'}.
                </>
              ) : (
                <>Je hebt alle mijlpalen gehaald.</>
              )}
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`h-2 flex-1 rounded-full ${n <= qualified ? 'bg-accent' : 'bg-[#efe9de]'}`} />
              ))}
            </div>
            <Link href="/beloningen" className="mt-3.5 inline-block text-[13.5px] font-bold text-accent hover:underline">
              {availableCodes > 0 ? `Bekijk je ${availableCodes} ${availableCodes === 1 ? 'code' : 'codes'}` : 'Bekijk je beloningen'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
