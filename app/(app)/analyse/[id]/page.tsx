'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ReferralWidget from '@/components/referral/ReferralWidget'
import { InfoTooltip, DBA_GLOSSARY } from '@/components/ui/info-tooltip'
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Loader2,
  Lightbulb,
  TrendingUp,
  FileText,
  CheckCircle2,
  Circle,
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Zap,
  GitCompare,
  FileDown,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Domain {
  key: string
  title: string
  scoreLabel: string
  scoreColor: string
  summary: string
  indicatorsForRisk: string[]
  indicatorsForIndependence: string[]
  suggestedImprovements: string[]
}

interface CompactDraft {
  title?: string
  assignmentDescription?: string
  deliverables?: string[]
  executionAndSteering?: string
  structuralNote?: string
}

interface LongDraft {
  title?: string
  assignmentDescription?: string
  deliverables?: string[]
  acceptanceCriteria?: string[]
  scopeExclusions?: string[]
  executionAndSteering?: string
  structuralNote?: string
}

interface FollowUpQuestion {
  key: string
  label: string
  question: string
  hint: string
}

interface Assessment {
  id: string
  overall_risk_color: string
  overall_risk_label: string
  overall_summary: string
  domains: Domain[]
  top_improvements: string[]
  compact_assignment_draft: string | object | null
  optimized_brief: string | object | null
  follow_up_questions: FollowUpQuestion[] | string[] | null
  input_text: string
  created_at: string
  parent_assessment_id: string | null
}

interface ParentAssessment {
  id: string
  overall_risk_label: string
  overall_summary: string
  domains: Domain[]
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseJson<T>(value: string | object | null | undefined): T | null {
  if (!value) return null
  if (typeof value === 'object') return value as T
  try { return JSON.parse(value) as T } catch { return null }
}

function riskConfig(level: string) {
  switch (level?.toLowerCase()) {
    case 'laag':
      return {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-400',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800',
        circle: '#10b981',
        icon: ShieldCheck,
        label: 'Laag risico',
        score: 88,
      }
    case 'hoog':
      return {
        bg: 'bg-red-500',
        bgLight: 'bg-red-50',
        border: 'border-red-400',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800',
        circle: '#ef4444',
        icon: ShieldAlert,
        label: 'Hoog risico',
        score: 25,
      }
    default:
      return {
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-50',
        border: 'border-amber-400',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        circle: '#f59e0b',
        icon: Shield,
        label: 'Gemiddeld risico',
        score: 55,
      }
  }
}

function domainScore(label: string): number {
  switch (label?.toLowerCase()) {
    case 'laag': return 88
    case 'hoog': return 22
    default: return 54
  }
}

function scenarioLabel(riskLabel: string): { text: string; color: string } {
  switch (riskLabel?.toLowerCase()) {
    case 'hoog':
      return { text: 'Sterk aanbevolen', color: 'bg-red-100 text-red-700 border-red-200' }
    case 'laag':
      return { text: 'Optioneel', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    default:
      return { text: 'Aanbevolen', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  }
}

// ── Score cirkel met animatie ─────────────────────────────────────────────────
function ScoreCircle({
  score,
  color,
  size = 80,
  strokeWidth = 8,
}: {
  score: number
  color: string
  size?: number
  strokeWidth?: number
}) {
  const [displayed, setDisplayed] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    let frame: number
    const duration = 1100
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(score * eased))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const dashOffset = circumference - (displayed / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/20"
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      />
      {/* Percentage tekst */}
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="currentColor"
        className="text-foreground"
      >
        {displayed}%
      </text>
    </svg>
  )
}

// ── Copy to clipboard knop ────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {copied ? 'Gekopieerd!' : 'Kopiëren'}
    </button>
  )
}

// ── Bouwstenen weergave helper ────────────────────────────────────────────────
function draftToPlainText(draft: CompactDraft | LongDraft | null): string {
  if (!draft) return ''
  const lines: string[] = []
  if (draft.title) lines.push(`TITEL\n${draft.title}`, '')
  if (draft.assignmentDescription) lines.push(`OPDRACHTOMSCHRIJVING\n${draft.assignmentDescription}`, '')
  if (draft.deliverables?.length) lines.push(`OPLEVERINGEN\n${draft.deliverables.map((d) => `• ${d}`).join('\n')}`, '')
  if ('executionAndSteering' in draft && draft.executionAndSteering) lines.push(`UITVOERING & AANSTURING\n${draft.executionAndSteering}`, '')
  if ('acceptanceCriteria' in draft && (draft as LongDraft).acceptanceCriteria?.length) {
    lines.push(`ACCEPTATIECRITERIA\n${(draft as LongDraft).acceptanceCriteria!.map((c) => `• ${c}`).join('\n')}`, '')
  }
  if (draft.structuralNote) lines.push(`NOOT\n${draft.structuralNote}`)
  return lines.join('\n')
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [parentAssessment, setParentAssessment] = useState<ParentAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [draftLoading, setDraftLoading] = useState(false)
  const [fullDraftLoading, setFullDraftLoading] = useState(false)
  const [reanalyseLoading, setReanalyseLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set([0, 1, 2]))
  const [draftTab, setDraftTab] = useState<'compact' | 'uitgebreid' | 'bouwstenen'>('compact')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeScenario, setActiveScenario] = useState<number | null>(null)
  const [heranalyseText, setHeranalyseText] = useState('')
  const [diffOpen, setDiffOpen] = useState(true)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/dba/assessments/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Analyse niet gevonden')
        return res.json()
      })
      .then((data) => { setAssessment(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [params.id])

  // Haal parent op zodra assessment geladen is en parent_assessment_id aanwezig is
  useEffect(() => {
    if (!assessment?.parent_assessment_id) return
    fetch(`/api/dba/assessments/${assessment.parent_assessment_id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setParentAssessment(data) })
      .catch(() => { /* parent ophalen is best-effort */ })
  }, [assessment?.parent_assessment_id])

  const toggleDomain = (i: number) =>
    setExpandedDomains((prev) => {
      const n = new Set(prev)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })

  const handleGenerateDraft = () => {
    if (!assessment || draftLoading) return
    setDraftLoading(true)
    fetch(`/api/dba/analyse/${params.id}/draft?mode=compact`, { method: 'POST' })
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d) => { setAssessment((prev) => prev ? { ...prev, ...d } : prev); setDraftLoading(false) })
      .catch(() => setDraftLoading(false))
  }

  const handleGenerateFullDraft = () => {
    if (!assessment || fullDraftLoading) return
    setFullDraftLoading(true)
    fetch(`/api/dba/analyse/${params.id}/draft?mode=full`, { method: 'POST' })
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d) => { setAssessment((prev) => prev ? { ...prev, ...d } : prev); setFullDraftLoading(false) })
      .catch(() => setFullDraftLoading(false))
  }

  const handleDraftTabChange = (tab: 'compact' | 'uitgebreid' | 'bouwstenen') => {
    setDraftTab(tab)
    if (
      (tab === 'uitgebreid' || tab === 'bouwstenen') &&
      assessment &&
      !parseJson<LongDraft>(assessment.optimized_brief) &&
      !fullDraftLoading
    ) {
      handleGenerateFullDraft()
    }
  }

  const handleReanalyse = async () => {
    if (!assessment || reanalyseLoading) return
    const aanvullingen = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => {
        const q = followUpQuestions.find((q) => q.key === k)
        return q ? `${q.label}: ${v.trim()}` : v.trim()
      })
      .join('\n')
    const extra = heranalyseText.trim()
    const combined = [assessment.input_text, aanvullingen, extra].filter(Boolean).join('\n\nAanvullende informatie:\n')
    setReanalyseLoading(true)
    try {
      const res = await fetch('/api/dba/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: combined, parentAssessmentId: params.id }),
      })
      const data = await res.json()
      if (data.id) router.push(`/analyse/${data.id}`)
    } finally {
      setReanalyseLoading(false)
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="size-10 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Analyse laden...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-xl p-8 space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {error || 'Analyse niet gevonden'}
        </div>
        <Link href="/analyse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Terug naar analyse
        </Link>
      </div>
    )
  }

  const risk = riskConfig(assessment.overall_risk_label)
  const RiskIcon = risk.icon
  const isFallback = assessment.overall_summary?.includes('technisch probleem')
  const compactDraft = parseJson<CompactDraft>(assessment.compact_assignment_draft)
  const longDraft = parseJson<LongDraft>(assessment.optimized_brief)
  const domains = (assessment.domains as Domain[]) ?? []
  const rawFollowUp = assessment.follow_up_questions
  const followUpQuestions: FollowUpQuestion[] = Array.isArray(rawFollowUp)
    ? rawFollowUp.filter((q): q is FollowUpQuestion => typeof q === 'object' && q !== null && 'key' in q)
    : []
  const improvements = (assessment.top_improvements as string[]) ?? []
  const hasAnswers = Object.values(answers).some((v) => v.trim()) || heranalyseText.trim().length > 0
  const scenarioRec = scenarioLabel(assessment.overall_risk_label)

  if (isFallback) {
    return (
      <div className="mx-auto max-w-2xl p-8 space-y-6">
        <Link href="/analyse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Terug
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-4">
          <AlertTriangle className="size-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Analyse kon niet worden voltooid</h2>
          <p className="text-muted-foreground">Er is een technisch probleem opgetreden. Ga terug en probeer het opnieuw.</p>
          <Link href="/analyse" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
            Opnieuw proberen
          </Link>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">

      {/* ── Hero risico-banner ─────────────────────────────────────────────── */}
      <div className={`${risk.bg} px-6 py-8`}>
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-4">
            <Link href="/analyse" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="size-4" /> Terug
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={`/api/dba/assessments/${params.id}/pdf`}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
              >
                <Download className="size-4" /> PDF
              </a>
              <a
                href={`/api/dba/assessments/${params.id}/docx`}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
              >
                <FileDown className="size-4" /> Word
              </a>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-6">
            {/* Score cirkel */}
            <div className="shrink-0">
              <ScoreCircle score={risk.score} color="rgba(255,255,255,0.9)" size={88} strokeWidth={9} />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">DBA Risico-analyse</p>
              <h1 className="text-3xl font-bold text-white mt-1">{risk.label}</h1>
              <p className="text-white/70 text-sm mt-1">
                {assessment.created_at
                  ? new Date(assessment.created_at).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </p>
            </div>
          </div>

          <p className="mt-4 text-white/90 text-base leading-relaxed max-w-2xl">
            {assessment.overall_summary}
          </p>
        </div>
      </div>

      {/* ── Pagina-inhoud ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-10">

        {/* ── Vergelijking met vorige analyse (diff) ────────────────────────── */}
        {parentAssessment && (
          <section>
            <button
              onClick={() => setDiffOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-violet-200 bg-violet-50 px-5 py-3 text-left hover:bg-violet-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GitCompare className="size-5 text-violet-600 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-violet-800">Vergelijking met vorige analyse</p>
                  <p className="text-xs text-violet-600 mt-0.5">
                    Vorige analyse: {new Date(parentAssessment.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {diffOpen
                ? <ChevronUp className="size-4 text-violet-500 shrink-0" />
                : <ChevronDown className="size-4 text-violet-500 shrink-0" />
              }
            </button>

            {diffOpen && (
              <div className="mt-3 rounded-xl border border-violet-200 bg-white overflow-hidden">
                {/* Overall risico vergelijking */}
                <div className="grid grid-cols-2 divide-x divide-violet-100 border-b border-violet-100">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Vorige analyse</p>
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${riskConfig(parentAssessment.overall_risk_label).badge}`}>
                      {(() => { const I = riskConfig(parentAssessment.overall_risk_label).icon; return <I className="size-3.5" /> })()}
                      {riskConfig(parentAssessment.overall_risk_label).label}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-snug line-clamp-3">{parentAssessment.overall_summary}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Huidige analyse</p>
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${risk.badge}`}>
                      {<RiskIcon className="size-3.5" />}
                      {risk.label}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-snug line-clamp-3">{assessment.overall_summary}</p>
                  </div>
                </div>

                {/* Domeinen vergelijking */}
                {parentAssessment.domains?.length > 0 && domains.length > 0 && (
                  <div className="divide-y divide-violet-50">
                    {domains.map((domain, idx) => {
                      const prev = parentAssessment.domains?.[idx]
                      if (!prev) return null
                      const prevCfg = riskConfig(prev.scoreLabel)
                      const currCfg = riskConfig(domain.scoreLabel)
                      const changed = prev.scoreLabel !== domain.scoreLabel
                      // Bepaal pijl: hoog→laag = verbetering (groen pijl omlaag), laag→hoog = verslechtering
                      const scoreNum = (l: string) => l === 'laag' ? 0 : l === 'midden' ? 1 : 2
                      const delta = scoreNum(domain.scoreLabel) - scoreNum(prev.scoreLabel)
                      const arrowEl = !changed
                        ? <span className="text-xs text-muted-foreground font-medium">ongewijzigd</span>
                        : delta < 0
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">↓ verbeterd</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">↑ verslechterd</span>

                      return (
                        <div key={domain.key ?? idx} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-3">
                          {/* Oud */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${prevCfg.badge}`}>
                              {prev.scoreLabel}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">{prev.summary?.slice(0, 60)}{prev.summary?.length > 60 ? '…' : ''}</span>
                          </div>

                          {/* Domein naam + pijl */}
                          <div className="flex flex-col items-center gap-1 min-w-[120px] text-center">
                            <span className="text-[10px] font-semibold text-foreground">{domain.title}</span>
                            {arrowEl}
                          </div>

                          {/* Nieuw */}
                          <div className="flex items-center justify-end gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground text-right truncate">{domain.summary?.slice(0, 60)}{domain.summary?.length > 60 ? '…' : ''}</span>
                            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${currCfg.badge}`}>
                              {domain.scoreLabel}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Footer met link naar vorige analyse */}
                <div className="border-t border-violet-100 px-5 py-3 bg-violet-50/50">
                  <Link
                    href={`/analyse/${parentAssessment.id}`}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium hover:underline"
                  >
                    Bekijk vorige analyse →
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Beoordeling per domein ────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Beoordeling per domein</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {domains.map((domain, index) => {
              const dr = riskConfig(domain.scoreLabel)
              const DomainIcon = dr.icon
              const expanded = expandedDomains.has(index)
              const dScore = domainScore(domain.scoreLabel)

              return (
                <div
                  key={domain.key ?? index}
                  className={`rounded-xl border-2 ${dr.border} ${dr.bgLight} overflow-hidden`}
                >
                  <button className="w-full text-left p-4" onClick={() => toggleDomain(index)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {/* Mini score cirkel */}
                        <ScoreCircle score={dScore} color={dr.circle} size={48} strokeWidth={5} />
                        <div className="min-w-0 pt-1">
                          <span className="font-semibold text-sm leading-tight">
                            {domain.title}
                            {domain.key === 'aansturing' && (
                              <InfoTooltip explanation={DBA_GLOSSARY.gezagsverhouding} />
                            )}
                            {domain.key === 'eigen_rekening_risico' && (
                              <InfoTooltip explanation={DBA_GLOSSARY.eigenRekeningRisico} />
                            )}
                            {domain.key === 'ondernemerschap' && (
                              <InfoTooltip explanation="De mate waarin je als zzp'er zichtbaar ondernemer bent: meerdere opdrachtgevers, eigen marketing, ondernemersrisico. Telt mee als context, niet als hoofdcriterium." />
                            )}
                          </span>
                          <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${dr.badge}`}>
                            {domain.scoreLabel}
                          </span>
                        </div>
                      </div>
                      {expanded
                        ? <ChevronUp className="size-4 text-muted-foreground shrink-0 mt-1" />
                        : <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1" />
                      }
                    </div>
                    {domain.summary && (
                      <p className="mt-2 text-sm text-muted-foreground leading-snug">{domain.summary}</p>
                    )}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/50 pt-3">
                      {domain.indicatorsForRisk?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1.5">
                            Risico-indicatoren
                            <InfoTooltip explanation={DBA_GLOSSARY.risicosignaal} />
                          </p>
                          <ul className="space-y-1">
                            {domain.indicatorsForRisk.map((ind, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <AlertTriangle className="size-3 shrink-0 mt-0.5 text-red-400" />
                                {ind}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {domain.indicatorsForIndependence?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
                            Onafhankelijkheid
                          </p>
                          <ul className="space-y-1">
                            {domain.indicatorsForIndependence.map((ind, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <ShieldCheck className="size-3 shrink-0 mt-0.5 text-emerald-500" />
                                {ind}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {domain.suggestedImprovements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1.5">
                            Aanbeveling
                          </p>
                          <ul className="space-y-1">
                            {domain.suggestedImprovements.map((imp, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <Lightbulb className="size-3 shrink-0 mt-0.5 text-blue-400" />
                                {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Actiepunten ──────────────────────────────────────────────────── */}
        {improvements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Actiepunten</h2>
            </div>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{imp}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Referral widget (GROWTH-002) ──────────────────────────────────── */}
        <ReferralWidget />

        {/* ── Beschikbare scenario's ───────────────────────────────────────── */}
        {improvements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="size-5 text-violet-500" />
              <h2 className="text-lg font-semibold">Beschikbare scenario&apos;s</h2>
              <span className={`ml-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${scenarioRec.color}`}>
                {scenarioRec.text}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Klik op een scenario om een voorbeeldtekst te laden in het heranalyse-veld.
            </p>
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {improvements.map((imp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveScenario(i === activeScenario ? null : i)
                    setHeranalyseText(
                      i === activeScenario
                        ? ''
                        : `Ik heb de volgende aanpassing doorgevoerd: ${imp}`
                    )
                  }}
                  className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors ${
                    activeScenario === i ? 'bg-violet-50' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 transition-colors ${
                    activeScenario === i ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {activeScenario === i ? <Check className="size-3" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{imp}</p>
                    {activeScenario === i && (
                      <p className="text-xs text-violet-600 font-medium mt-1">
                        ✓ Voorbeeldtekst geladen in heranalyse-veld
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Follow-up vragen ─────────────────────────────────────────────── */}
        {(followUpQuestions.length > 0 || improvements.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold">Analyse verfijnen</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Voeg aanvullende informatie toe of beschrijf een scenario om de analyse te heruitvoeren.
            </p>

            {followUpQuestions.length > 0 && (
              <div className="rounded-xl border border-border bg-card divide-y divide-border mb-4">
                {followUpQuestions.map((q) => (
                  <div key={q.key} className="px-5 py-4 space-y-2">
                    <label className="text-sm font-medium text-foreground">{q.question}</label>
                    <p className="text-xs text-muted-foreground">{q.hint}</p>
                    <textarea
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      rows={2}
                      placeholder="Uw antwoord..."
                      value={answers[q.key] ?? ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Scenario heranalyse tekstveld */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {activeScenario !== null ? 'Scenario-tekst (bewerken indien gewenst)' : 'Aanvullende opmerkingen'}
              </label>
              <textarea
                className={`w-full rounded-xl border-2 bg-card px-4 py-3 text-sm outline-none resize-none leading-relaxed transition-colors min-h-[100px] ${
                  heranalyseText.trim()
                    ? 'border-violet-400 focus:ring-2 focus:ring-violet-400/20'
                    : 'border-border focus:border-ring focus:ring-2 focus:ring-ring/20'
                }`}
                placeholder="Beschrijf hier aanpassingen of geselecteerd scenario..."
                value={heranalyseText}
                onChange={(e) => {
                  setHeranalyseText(e.target.value)
                  if (activeScenario !== null && e.target.value === '') setActiveScenario(null)
                }}
                rows={3}
              />
            </div>

            <div className="mt-3">
              <button
                onClick={handleReanalyse}
                disabled={!hasAnswers || reanalyseLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {reanalyseLoading
                  ? <><Loader2 className="size-4 animate-spin" /> Heranalyseren...</>
                  : <><RefreshCw className="size-4" /> Heranalyseer met aanvullingen</>
                }
              </button>
            </div>
          </section>
        )}

        {/* ── Opdrachtformulering ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-violet-500" />
              <h2 className="text-lg font-semibold">Opdrachtformulering</h2>
            </div>
            {!compactDraft && !longDraft && !draftLoading && (
              <button
                onClick={handleGenerateDraft}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <FileText className="size-4" />
                Genereer
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {draftLoading ? (
              <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin shrink-0" />
                <div>
                  <p className="font-medium">Opdrachtteksten worden gegenereerd...</p>
                  <p className="text-xs mt-0.5 text-muted-foreground/70">Dit duurt circa 3–5 seconden</p>
                </div>
              </div>
            ) : (compactDraft || longDraft) ? (
              <div>
                {/* Tab bar: compact / uitgebreid / bouwstenen */}
                <div className="flex border-b border-border">
                  {(
                    [
                      { key: 'compact', label: 'Compact', icon: FileText },
                      { key: 'uitgebreid', label: 'Uitgebreid', icon: TrendingUp },
                      { key: 'bouwstenen', label: 'Bouwstenen', icon: Layers },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      className={`flex items-center gap-1.5 flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                        draftTab === key
                          ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => handleDraftTabChange(key)}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Compact tab */}
                {draftTab === 'compact' && compactDraft && (
                  <div className="p-6 space-y-5">
                    <div className="flex justify-end">
                      <CopyButton text={draftToPlainText(compactDraft)} />
                    </div>
                    {compactDraft.title && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Titel</p>
                        <p className="font-semibold text-foreground">{compactDraft.title}</p>
                      </div>
                    )}
                    {compactDraft.assignmentDescription && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Opdrachtomschrijving</p>
                        <p className="text-sm text-foreground leading-relaxed">{compactDraft.assignmentDescription}</p>
                      </div>
                    )}
                    {compactDraft.deliverables && compactDraft.deliverables.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Opleveringen</p>
                        <ul className="space-y-1.5">
                          {compactDraft.deliverables.map((d, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-violet-400" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {compactDraft.executionAndSteering && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Uitvoering & aansturing</p>
                        <p className="text-sm text-foreground leading-relaxed">{compactDraft.executionAndSteering}</p>
                      </div>
                    )}
                    {compactDraft.structuralNote && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Structurele noot</p>
                        <p className="text-sm text-amber-800">{compactDraft.structuralNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Uitgebreid tab */}
                {draftTab === 'uitgebreid' && fullDraftLoading && (
                  <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
                    <Loader2 className="size-5 animate-spin shrink-0" />
                    <div>
                      <p className="font-medium">Uitgebreide versie wordt opgesteld...</p>
                      <p className="text-xs mt-0.5 text-muted-foreground/70">Dit duurt circa 8–12 seconden</p>
                    </div>
                  </div>
                )}
                {draftTab === 'uitgebreid' && !fullDraftLoading && !longDraft && (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">De uitgebreide versie kon niet worden geladen.</p>
                    <button
                      onClick={handleGenerateFullDraft}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                    >
                      <RefreshCw className="size-4" /> Opnieuw proberen
                    </button>
                  </div>
                )}
                {draftTab === 'uitgebreid' && !fullDraftLoading && longDraft && (
                  <div className="p-6 space-y-5">
                    <div className="flex justify-end">
                      <CopyButton text={draftToPlainText(longDraft)} />
                    </div>
                    {longDraft.title && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Titel</p>
                        <p className="font-semibold text-foreground">{longDraft.title}</p>
                      </div>
                    )}
                    {longDraft.assignmentDescription && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Omschrijving</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{longDraft.assignmentDescription}</p>
                      </div>
                    )}
                    {longDraft.deliverables && longDraft.deliverables.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Opleveringen</p>
                        <ul className="space-y-1.5">
                          {longDraft.deliverables.map((d, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Circle className="size-4 shrink-0 mt-0.5 text-violet-300" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {longDraft.acceptanceCriteria && longDraft.acceptanceCriteria.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acceptatiecriteria</p>
                        <ul className="space-y-1.5">
                          {longDraft.acceptanceCriteria.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {longDraft.scopeExclusions && longDraft.scopeExclusions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Buiten scope</p>
                        <ul className="space-y-1.5">
                          {longDraft.scopeExclusions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="shrink-0 mt-0.5">-</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {longDraft.executionAndSteering && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Uitvoering & aansturing</p>
                        <p className="text-sm text-foreground leading-relaxed">{longDraft.executionAndSteering}</p>
                      </div>
                    )}
                    {longDraft.structuralNote && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Structurele noot</p>
                        <p className="text-sm text-amber-800">{longDraft.structuralNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bouwstenen tab */}
                {draftTab === 'bouwstenen' && fullDraftLoading && (
                  <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
                    <Loader2 className="size-5 animate-spin shrink-0" />
                    <p className="font-medium">Bouwstenen worden voorbereid...</p>
                  </div>
                )}
                {draftTab === 'bouwstenen' && !fullDraftLoading && (() => {
                  const draft = longDraft ?? compactDraft
                  if (!draft) return (
                    <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">Bouwstenen niet beschikbaar.</p>
                    </div>
                  )
                  const blocks: { label: string; content: string }[] = []
                  if (draft.title) blocks.push({ label: 'Titel', content: draft.title })
                  if (draft.assignmentDescription) blocks.push({ label: 'Opdrachtomschrijving', content: draft.assignmentDescription })
                  if (draft.deliverables?.length) blocks.push({ label: 'Opleveringen', content: draft.deliverables.map((d) => `• ${d}`).join('\n') })
                  if ('acceptanceCriteria' in draft && (draft as LongDraft).acceptanceCriteria?.length) {
                    blocks.push({ label: 'Acceptatiecriteria', content: (draft as LongDraft).acceptanceCriteria!.map((c) => `• ${c}`).join('\n') })
                  }
                  if ('executionAndSteering' in draft && draft.executionAndSteering) {
                    blocks.push({ label: 'Uitvoering & aansturing', content: draft.executionAndSteering! })
                  }
                  if (draft.structuralNote) blocks.push({ label: 'Structurele noot', content: draft.structuralNote })
                  return (
                    <div className="divide-y divide-border">
                      {blocks.map((block) => (
                        <div key={block.label} className="px-5 py-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{block.label}</p>
                            <CopyButton text={block.content} />
                          </div>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{block.content}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}

              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                Klik op &quot;Genereer&quot; om een professionele opdrachttekst te laten opstellen op basis van deze analyse.
              </div>
            )}
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-800">
          <strong>Disclaimer:</strong> Deze analyse is een hulpmiddel en vervangt geen juridisch advies. De resultaten zijn indicatief. Raadpleeg altijd een specialist voor definitieve beoordeling.
        </div>

      </div>
    </div>
  )
}
