'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Share2, Gift, ChevronRight, Tag } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReferralCode {
  id: string
  code: string
  isUsed: boolean
  usedAt: string | null
}

interface ReferralStats {
  codes: ReferralCode[]
  referralBaseUrl: string
  qualifiedCount: number
  statusMessage: string
  rewards: Array<{ milestone: number; reward_type: string; granted_at: string }>
}

// ── Mijlpalen config ───────────────────────────────────────────────────────────

const MILESTONES = [
  {
    count: 1,
    reward: '1 gratis analyse',
    detail: 'Jij ontvangt direct een extra analysecheck.',
    validity: '30 dagen geldig',
  },
  {
    count: 3,
    reward: '1 maand gratis',
    detail: 'Een volledige maand DBA Kompas Pro zonder kosten.',
    validity: '60 dagen om in te zetten',
  },
  {
    count: 5,
    reward: '2 maanden gratis',
    detail: 'Twee maanden DBA Kompas Pro zonder kosten.',
    validity: '60 dagen om in te zetten',
  },
]

const MAX_MILESTONE = 5

// ── Voortgangsbalk ────────────────────────────────────────────────────────────

function VoortgangsBar({ count }: { count: number }) {
  const capped = Math.min(count, MAX_MILESTONE)
  const pct = (capped / MAX_MILESTONE) * 100

  const nextMilestone = MILESTONES.find(m => count < m.count)
  const remaining = nextMilestone ? nextMilestone.count - count : 0
  const allDone = count >= MAX_MILESTONE
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      {/* Teller */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Jouw doorverwijzingen
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">{count}</span>
            <span className="text-sm text-muted-foreground">/ {MAX_MILESTONE} mijlpalen</span>
          </div>
        </div>
        {allDone ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Alles bereikt
          </span>
        ) : nextMilestone ? (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            Nog {remaining} voor {nextMilestone.reward}
          </span>
        ) : null}
      </div>

      {/* Balk */}
      <div className="relative pt-3 pb-3">
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Mijlpaalstippen met tooltip op hover/focus/tap */}
        {MILESTONES.map((m) => {
          const pos = (m.count / MAX_MILESTONE) * 100
          const reached = count >= m.count
          const isNext = !reached && nextMilestone?.count === m.count
          const isActive = active === m.count
          return (
            <button
              type="button"
              key={m.count}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-help focus:outline-none"
              style={{ left: `${pos}%` }}
              onMouseEnter={() => setActive(m.count)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(m.count)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(isActive ? null : m.count)}
              aria-label={`Mijlpaal ${m.count}: ${m.reward}, ${m.validity}`}
            >
              <div
                className={`size-4 rounded-full border-2 transition-all duration-300 ${
                  reached
                    ? 'bg-orange-500 border-orange-500 scale-110'
                    : isNext
                    ? 'bg-card border-orange-400 ring-4 ring-orange-200/60 animate-pulse'
                    : 'bg-card border-border'
                } ${isActive ? 'scale-150 shadow-lg shadow-orange-500/40' : ''}`}
              />
              {isActive && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-16 z-10 w-48 rounded-lg bg-foreground text-background text-xs font-medium shadow-xl px-3 py-2 pointer-events-none">
                  <p className="font-bold">{m.count} doorverwijzing{m.count === 1 ? '' : 'en'}</p>
                  <p className="opacity-80 mt-0.5">{m.reward}</p>
                  <p className="opacity-60 mt-0.5 text-[10px] uppercase tracking-wide">{m.validity}</p>
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 size-2 bg-foreground rotate-45" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Labels onder de balk (zonder x) */}
      <div className="relative h-5">
        {MILESTONES.map((m) => {
          const pos = (m.count / MAX_MILESTONE) * 100
          const reached = count >= m.count
          return (
            <div
              key={m.count}
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${pos}%` }}
            >
              <span className={`text-[11px] font-medium ${
                reached ? 'text-orange-600' : 'text-muted-foreground'
              }`}>
                {m.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Code-rij ──────────────────────────────────────────────────────────────────

function CodeRij({ code, isUsed, baseUrl }: { code: string; isUsed: boolean; baseUrl: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${baseUrl}${code}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'DBA Kompas',
        text: 'Probeer DBA Kompas met 20% korting via mijn uitnodigingscode:',
        url,
      })
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`Probeer DBA Kompas met 20% korting: ${url}`)}`,
        '_blank'
      )
    }
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
      isUsed
        ? 'border-border bg-muted/30'
        : 'border-border bg-card hover:border-orange-200'
    }`}>
      <div className={`size-2.5 rounded-full shrink-0 ${
        isUsed ? 'bg-emerald-500' : 'bg-muted-foreground/20'
      }`} />

      <span className={`font-mono text-sm font-bold tracking-widest flex-1 truncate ${
        isUsed ? 'text-muted-foreground' : 'text-foreground'
      }`}>
        {code}
      </span>

      {isUsed ? (
        <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <Check className="size-3.5" /> Verzilverd
        </span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Gekopieerd!' : 'Kopieer'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-colors"
            title="Delen"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Beloningen-overzicht ───────────────────────────────────────────────────────

function BeloningenOverzicht({ count }: { count: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm font-semibold">Beloningen per mijlpaal</p>
      <div className="space-y-2">
        {MILESTONES.map((m) => {
          const reached = count >= m.count
          const isNext = !reached && MILESTONES.find(x => count < x.count)?.count === m.count
          return (
            <div
              key={m.count}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                reached
                  ? 'bg-emerald-50 border border-emerald-200'
                  : isNext
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-muted/30 border border-border opacity-60'
              }`}
            >
              <div className={`shrink-0 flex items-center justify-center size-7 rounded-full text-xs font-bold ${
                reached
                  ? 'bg-emerald-500 text-white'
                  : isNext
                  ? 'bg-orange-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {reached ? <Check className="size-4" /> : m.count}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className={`text-sm font-semibold ${
                    reached ? 'text-emerald-700' : isNext ? 'text-orange-700' : 'text-foreground'
                  }`}>
                    {m.reward}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    reached
                      ? 'bg-emerald-100 text-emerald-700'
                      : isNext
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {m.validity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.detail}</p>
              </div>
              {reached && (
                <span className="shrink-0 text-xs font-semibold text-emerald-600">Bereikt</span>
              )}
              {isNext && !reached && (
                <ChevronRight className="size-4 shrink-0 text-orange-500" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────

export default function BeloningenPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral/code')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.codes) setStats(d) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-orange-500" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Gratis toegang en beloningen</h1>
        <p className="text-sm text-muted-foreground">Kon de beloningsdata niet laden. Probeer de pagina te vernieuwen.</p>
      </div>
    )
  }

  const usedCount = stats.codes.filter(c => c.isUsed).length
  const availableCount = stats.codes.length - usedCount

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Titel */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Gift className="size-6 text-orange-500 shrink-0" />
          <h1 className="text-3xl font-bold tracking-tight">Gratis toegang en beloningen</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Verwijs collega's en ZZP'ers door. Voor elke succesvolle doorverwijzing bouw je mee aan gratis toegang.
        </p>
      </div>

      {/* 20% regel uitleg */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 flex items-start gap-3">
        <Tag className="size-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-orange-900">
            Iedereen die jouw code gebruikt krijgt 20% korting
          </p>
          <p className="text-xs text-orange-800/90 leading-relaxed">
            Je vriend of collega krijgt 20% korting op de eerste DBA-check of het eerste abonnement. Jij verdient ondertussen een mijlpaal-beloning. Zo snijdt het mes aan twee kanten.
          </p>
        </div>
      </div>

      {/* Voortgangsbalk */}
      <VoortgangsBar count={stats.qualifiedCount} />

      {/* Codes */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Jouw uitnodigingscodes</p>
          <span className="text-xs text-muted-foreground">
            {availableCount} beschikbaar · {usedCount} verzilverd
          </span>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Deel een code of link. Je vriend krijgt 20% korting, jij bouwt punten op.
        </p>
        <div className="space-y-2">
          {stats.codes.map(c => (
            <CodeRij
              key={c.id}
              code={c.code}
              isUsed={c.isUsed}
              baseUrl={stats.referralBaseUrl}
            />
          ))}
        </div>
      </div>

      {/* Beloningen */}
      <BeloningenOverzicht count={stats.qualifiedCount} />

      {/* Uitleg */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm font-semibold">Hoe werkt het?</p>
        <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
          <li>Deel een van jouw codes of kopieer de uitnodigingslink.</li>
          <li>Jouw contactpersoon start een check via jouw code en krijgt 20% korting.</li>
          <li>Zodra zij succesvol betaald hebben, telt dit als doorverwijzing.</li>
          <li>Bij elke mijlpaal ontvang jij automatisch de bijbehorende beloning.</li>
          <li>Beloningen blijven beperkt geldig (zie het label per mijlpaal).</li>
        </ol>
      </div>

    </div>
  )
}
