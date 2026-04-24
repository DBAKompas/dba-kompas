'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Gift, Users, ExternalLink } from 'lucide-react'

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

// ── Mijlpalen ─────────────────────────────────────────────────────────────────

const MILESTONES = [
  { count: 1, reward: '1 gratis analyse' },
  { count: 3, reward: '1 maand gratis toegang' },
  { count: 5, reward: '2 maanden gratis toegang' },
]

// ── CodeRow ───────────────────────────────────────────────────────────────────

function CodeRow({
  code,
  isUsed,
  baseUrl,
}: {
  code: string
  isUsed: boolean
  baseUrl: string
}) {
  const [copied, setCopied] = useState(false)
  const url = `${baseUrl}${code}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
      isUsed
        ? 'border-border bg-muted/30 opacity-60'
        : 'border-violet-200 bg-white'
    }`}>
      <span className={`font-mono text-sm font-bold tracking-widest flex-1 truncate ${
        isUsed ? 'text-muted-foreground line-through' : 'text-foreground'
      }`}>
        {code}
      </span>
      {isUsed ? (
        <span className="shrink-0 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
          <Check className="size-3" /> Verzilverd
        </span>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            title="Kopieer uitnodigingslink"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
            }`}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'Gekopieerd!' : 'Kopieer link'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Probeer DBA Kompas gratis: ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Deel via WhatsApp"
            className="flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-violet-600 transition-colors"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      )}
    </div>
  )
}

// ── MijlpaalBalk ──────────────────────────────────────────────────────────────

function MijlpaalBalk({ qualifiedCount }: { qualifiedCount: number }) {
  return (
    <div className="space-y-1.5">
      {MILESTONES.map((m) => {
        const reached = qualifiedCount >= m.count
        const isNext = !reached && MILESTONES.find(x => qualifiedCount < x.count)?.count === m.count
        const remaining = Math.max(0, m.count - qualifiedCount)
        return (
          <div
            key={m.count}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
              reached
                ? 'bg-emerald-50 border border-emerald-200'
                : isNext
                  ? 'bg-white border border-violet-200/60'
                  : 'bg-muted/30 border border-transparent opacity-50'
            }`}
          >
            <span className="font-bold text-muted-foreground shrink-0 w-4 text-center">
              {m.count}×
            </span>
            <span className={`flex-1 ${reached ? 'text-emerald-700 font-medium' : 'text-foreground'}`}>
              {m.reward}
            </span>
            {reached ? (
              <span className="shrink-0 text-[11px] font-semibold text-emerald-600">✓ Bereikt</span>
            ) : isNext ? (
              <span className="shrink-0 text-[11px] text-violet-600 font-medium">
                nog {remaining}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────

export default function ReferralWidget() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral/code')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.codes) setStats(d) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) return null

  const usedCount = stats.codes.filter(c => c.isUsed).length
  const availableCount = stats.codes.length - usedCount

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gift className="size-5 text-violet-600 shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">Verwijs vrienden, verdien gratis toegang</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Je hebt {availableCount} code{availableCount !== 1 ? 's' : ''} beschikbaar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-violet-100 px-2.5 py-1">
          <Users className="size-3.5 text-violet-600" />
          <span className="text-xs font-bold text-violet-700">{stats.qualifiedCount}</span>
        </div>
      </div>

      {/* Statusbericht */}
      <div className="rounded-lg bg-white/70 border border-violet-100 px-4 py-3">
        <p className="text-sm text-foreground leading-snug">{stats.statusMessage}</p>
      </div>

      {/* Codes */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Jouw codes — elk eenmalig te gebruiken
        </p>
        {stats.codes.map(c => (
          <CodeRow
            key={c.id}
            code={c.code}
            isUsed={c.isUsed}
            baseUrl={stats.referralBaseUrl}
          />
        ))}
      </div>

      {/* Mijlpalen */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Beloningen
        </p>
        <MijlpaalBalk qualifiedCount={stats.qualifiedCount} />
      </div>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Jouw vriend krijgt een gratis DBA-check, jij bouwt aan gratis toegang.
      </p>
    </div>
  )
}
