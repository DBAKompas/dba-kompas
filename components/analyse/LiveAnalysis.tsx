'use client'

// Live weergave van een lopende analyse. Onderdelen verschijnen zodra ze klaar zijn;
// wat nog loopt toont een bewegende plaatshouder. Na afloop volgt een melding met
// een knop naar de volledige analyse.

import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { V3Source } from './V3Insights'

export interface LiveDomain {
  key?: string
  title?: string
  scoreLabel?: string
  score?: number
  summary?: string
  indicatorsForRisk?: string[]
  indicatorsForIndependence?: string[]
}

export interface LiveState {
  overall?: { overallRiskLabel: string; overallSummary: string }
  weging?: string
  domains: LiveDomain[]
  topImprovements?: string[]
  vragenVoorGesprek?: string[]
  bronnen?: V3Source[]
  doneId?: string
}

const DOMAIN_TITLES = [
  'Aansturing, gezag en organisatorische inbedding',
  'Werken voor eigen rekening en risico',
  'Ondernemerschap',
]

function risk(label?: string) {
  switch (label?.toLowerCase()) {
    case 'laag':
      return { text: 'Laag risico', short: 'laag', score: 88, color: '#1f9d6b' }
    case 'hoog':
      return { text: 'Hoog risico', short: 'hoog', score: 25, color: '#d2493a' }
    default:
      return { text: 'Gemiddeld risico', short: 'gemiddeld', score: 55, color: '#d99a1c' }
  }
}

function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 animate-pulse rounded-full bg-muted"
          style={{ width: `${[100, 92, 68, 84][i % 4]}%` }}
        />
      ))}
    </div>
  )
}

function Ring({ score, color, label, size = 96 }: { score: number; color: string; label: string; size?: number }) {
  const c = 2 * Math.PI * 55
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 132 132" className="-rotate-90" aria-hidden="true">
        <circle cx="66" cy="66" r="55" fill="none" strokeWidth="11" stroke="#efe9de" />
        <circle
          cx="66"
          cy="66"
          r="55"
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-[22px] leading-none tracking-tight">{score}%</strong>
        <small className="mt-[3px] text-[11px] font-semibold text-muted-foreground">{label}</small>
      </div>
    </div>
  )
}

const card = 'rounded-[18px] border border-border bg-card p-6'
const fade = 'animate-in fade-in duration-500'

export function LiveAnalysis({ state }: { state: LiveState }) {
  const done = Boolean(state.doneId)
  const steps = [
    { label: 'Totaalbeeld', ready: Boolean(state.overall) },
    { label: `Onderdelen ${Math.min(state.domains.length, 3)} van 3`, ready: state.domains.length >= 3 },
    { label: 'Weging', ready: Boolean(state.weging) },
    { label: 'Verbeteringen', ready: Boolean(state.topImprovements) },
    { label: 'Gespreksvragen', ready: Boolean(state.vragenVoorGesprek) },
    { label: 'Bronnen', ready: Boolean(state.bronnen) },
  ]
  const overall = state.overall ? risk(state.overall.overallRiskLabel) : null

  return (
    <div className="space-y-6" aria-live="polite">
      {done ? (
        <div className={`flex flex-col gap-4 rounded-[18px] border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between ${fade}`}>
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Je analyse is klaar</p>
              <p className="text-sm text-green-800">
                Alles staat hieronder. In de volledige analyse vind je de details per onderdeel, de downloads en de
                opdrachtomschrijving op afroep.
              </p>
            </div>
          </div>
          <Link
            href={`/analyse/${state.doneId}`}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent/90"
          >
            Open de volledige analyse
          </Link>
        </div>
      ) : (
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            Je analyse loopt
            <Loader2 className="size-6 animate-spin text-accent" />
          </h1>
          <p className="mt-1 text-muted-foreground">
            Onderdelen verschijnen zodra ze klaar zijn. Je kunt alvast meelezen.
          </p>
        </div>
      )}

      {/* Voortgang */}
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <span
            key={step.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              step.ready ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
            }`}
          >
            {step.ready ? <CheckCircle className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
            {step.label}
          </span>
        ))}
      </div>

      {/* Totaalbeeld */}
      <div className={card}>
        <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Totaalbeeld</h2>
        {state.overall && overall ? (
          <div className={`grid items-center gap-5 sm:grid-cols-[96px_1fr] ${fade}`}>
            <Ring score={overall.score} color={overall.color} label={overall.short} />
            <div>
              <h3 className="text-xl font-bold">{overall.text}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{state.overall.overallSummary}</p>
            </div>
          </div>
        ) : (
          <div className="grid items-center gap-5 sm:grid-cols-[96px_1fr]">
            <div className="size-24 animate-pulse rounded-full bg-muted" />
            <Skeleton />
          </div>
        )}
      </div>

      {/* Onderdelen */}
      <div className="grid gap-[18px] md:grid-cols-3">
        {DOMAIN_TITLES.map((title, i) => {
          const d = state.domains[i]
          const r = d ? risk(d.scoreLabel) : null
          return (
            <div key={title} className={card}>
              <h3 className="text-sm font-bold leading-snug">{d?.title || title}</h3>
              {d && r ? (
                <div className={fade}>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: r.color }}>
                      {r.short}
                    </span>
                    {typeof d.score === 'number' && <span className="text-xs text-muted-foreground">{d.score} van 100</span>}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efe9de]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${typeof d.score === 'number' ? d.score : r.score}%`, background: r.color, transition: 'width 1s ease' }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{d.summary}</p>
                  {(d.indicatorsForRisk?.length ?? 0) > 0 && (
                    <p className="mt-3 border-t border-border pt-3 text-[13px] text-foreground/80">{d.indicatorsForRisk![0]}</p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <Skeleton lines={4} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Weging */}
      <div className={card}>
        <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">De weging</h2>
        {state.weging ? <p className={`text-sm leading-relaxed text-foreground/85 ${fade}`}>{state.weging}</p> : <Skeleton lines={4} />}
      </div>

      <div className="grid gap-[18px] lg:grid-cols-2">
        <div className={card}>
          <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Belangrijkste verbeteringen
          </h2>
          {state.topImprovements ? (
            <div className={`grid gap-2 ${fade}`}>
              {state.topImprovements.map((item, i) => (
                <div key={i} className="rounded-[10px] border border-[#f4dcc0] bg-[#fff7ee] px-3 py-2.5 text-sm">
                  <b className="text-accent">{i + 1}.</b> {item}
                </div>
              ))}
            </div>
          ) : (
            <Skeleton lines={4} />
          )}
        </div>
        <div className={card}>
          <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Vragen voor het gesprek
          </h2>
          {state.vragenVoorGesprek ? (
            <div className={`grid gap-2 ${fade}`}>
              {state.vragenVoorGesprek.map((item, i) => (
                <p key={i} className="flex gap-2.5 rounded-[10px] bg-[#f7f3ec] px-3 py-2.5 text-sm">
                  <b className="text-accent">{i + 1}.</b>
                  <span>{item}</span>
                </p>
              ))}
            </div>
          ) : (
            <Skeleton lines={4} />
          )}
        </div>
      </div>

      {/* Bronnen */}
      <div className={card}>
        <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Bronnen</h2>
        {state.bronnen ? (
          state.bronnen.length > 0 ? (
            <div className={`divide-y divide-border ${fade}`}>
              {state.bronnen.map((bron, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <a href={bron.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline underline-offset-4 break-words">
                    {bron.titel}
                  </a>
                  <p className="mt-1 text-sm text-muted-foreground">{bron.relevantie}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Voor deze analyse zijn geen aanvullende bronnen opgenomen.</p>
          )
        ) : (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Bronnen worden gecontroleerd voordat ze getoond worden.</p>
            <Skeleton lines={2} />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Indicatieve analyse, geen juridisch advies.</p>
    </div>
  )
}
