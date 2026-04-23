'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Gift, Users, ChevronRight } from 'lucide-react'

interface ReferralStats {
  code: string
  referralUrl: string
  qualifiedCount: number
  rewards: Array<{ milestone: number; reward_type: string; granted_at: string }>
}

const MILESTONES = [
  { count: 1, label: '1 doorverwijzing', reward: '1 gratis analyse', icon: '🎁' },
  { count: 3, label: '3 doorverwijzingen', reward: '1 maand gratis', icon: '🏆' },
  { count: 5, label: '5 doorverwijzingen', reward: '2 maanden gratis', icon: '⭐' },
]

export default function ReferralWidget() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral/code')
      .then((res) => res.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleCopy = async () => {
    if (!stats) return
    await navigator.clipboard.writeText(stats.referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) return null
  if (!stats) return null

  const nextMilestone = MILESTONES.find((m) => m.count > stats.qualifiedCount)
  const rewardedMilestones = new Set(stats.rewards.map((r) => r.milestone))

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gift className="size-5 text-violet-600 shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">Deel DBA Kompas - verdien gratis analyses</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stuur uw persoonlijke link naar een collega zzp&apos;er
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-violet-100 px-2.5 py-1">
          <Users className="size-3.5 text-violet-600" />
          <span className="text-xs font-bold text-violet-700">{stats.qualifiedCount}</span>
        </div>
      </div>

      {/* Referral URL kopiëren */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{stats.referralUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Gekopieerd!' : 'Kopieer link'}
        </button>
      </div>

      {/* Mijlpalen voortgang */}
      <div className="space-y-2">
        {MILESTONES.map((m) => {
          const achieved = stats.qualifiedCount >= m.count
          const rewarded = rewardedMilestones.has(m.count)
          const isNext = nextMilestone?.count === m.count
          const remaining = Math.max(0, m.count - stats.qualifiedCount)

          return (
            <div
              key={m.count}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                achieved ? 'bg-white border border-emerald-200' : isNext ? 'bg-white/60 border border-violet-200/60' : 'opacity-50'
              }`}
            >
              <span className="text-base shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${achieved ? 'text-emerald-700' : 'text-foreground'}`}>
                  {m.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{m.reward}</p>
              </div>
              {achieved ? (
                <span className="shrink-0 text-[11px] font-semibold text-emerald-600">
                  {rewarded ? '✓ Verdiend' : '✓ Bereikt'}
                </span>
              ) : isNext ? (
                <span className="shrink-0 text-[11px] text-violet-600 font-medium flex items-center gap-0.5">
                  nog {remaining} <ChevronRight className="size-3" />
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Uw code: <span className="font-mono font-bold tracking-wider">{stats.code}</span>
      </p>
    </div>
  )
}
