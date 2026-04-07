'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
} from 'lucide-react'

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
}

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
        icon: ShieldCheck,
        label: 'Laag risico',
      }
    case 'hoog':
      return {
        bg: 'bg-red-500',
        bgLight: 'bg-red-50',
        border: 'border-red-400',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800',
        icon: ShieldAlert,
        label: 'Hoog risico',
      }
    default:
      return {
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-50',
        border: 'border-amber-400',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        icon: Shield,
        label: 'Gemiddeld risico',
      }
  }
}

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [draftLoading, setDraftLoading] = useState(false)
  const [reanalyseLoading, setReanalyseLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set([0, 1, 2]))
  const [activeTab, setActiveTab] = useState<'compact' | 'long'>('compact')
  const [answers, setAnswers] = useState<Record<string, string>>({})

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

  const toggleDomain = (i: number) =>
    setExpandedDomains((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  const handleGenerateDraft = () => {
    if (!assessment || draftLoading) return
    setDraftLoading(true)
    fetch(`/api/dba/analyse/${params.id}/draft`, { method: 'POST' })
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d) => { setAssessment((prev) => prev ? { ...prev, ...d } : prev); setDraftLoading(false) })
      .catch(() => setDraftLoading(false))
  }

  const handleReanalyse = async () => {
    if (!assessment || reanalyseLoading) return
    const aanvullingen = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => {
        const q = followUpQuestions.find(q => q.key === k)
        return q ? `${q.label}: ${v.trim()}` : v.trim()
      })
      .join('\n')
    if (!aanvullingen) return
    const combinedText = `${assessment.input_text}\n\nAanvullende informatie:\n${aanvullingen}`
    setReanalyseLoading(true)
    try {
      const res = await fetch('/api/dba/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: combinedText }),
      })
      const data = await res.json()
      if (data.id) {
        router.push(`/analyse/${data.id}`)
      }
    } finally {
      setReanalyseLoading(false)
    }
  }

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
          <ArrowLeft className="size-4" /> Terug naar analyses
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

  // Follow-up vragen: kunnen objecten zijn (nieuw) of strings (oud)
  const rawFollowUp = assessment.follow_up_questions
  const followUpQuestions: FollowUpQuestion[] = Array.isArray(rawFollowUp)
    ? rawFollowUp.filter((q): q is FollowUpQuestion => typeof q === 'object' && q !== null && 'key' in q)
    : []

  const hasAnswers = Object.values(answers).some(v => v.trim())

  if (isFallback) {
    return (
      <div className="mx-auto max-w-2xl p-8 space-y-6">
        <Link href="/analyse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Terug naar analyses
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-4">
          <AlertTriangle className="size-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Analyse kon niet worden voltooid</h2>
          <p className="text-muted-foreground">Er is een technisch probleem opgetreden bij het verwerken van uw opdracht. Ga terug en probeer het opnieuw.</p>
          <Link href="/analyse" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
            Opnieuw proberen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero risk banner */}
      <div className={`${risk.bg} px-6 py-8`}>
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-4">
            <Link href="/analyse" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="size-4" /> Terug
            </Link>
            <a href={`/api/dba/assessments/${params.id}/pdf`} download
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors">
              <Download className="size-4" /> PDF
            </a>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="rounded-2xl bg-white/20 p-4">
              <RiskIcon className="size-10 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">DBA Risico-analyse</p>
              <h1 className="text-3xl font-bold text-white mt-1">{risk.label}</h1>
              <p className="text-white/80 text-sm mt-1">
                {assessment.created_at
                  ? new Date(assessment.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
                  : ''}
              </p>
            </div>
          </div>
          <p className="mt-4 text-white/90 text-base leading-relaxed max-w-2xl">
            {assessment.overall_summary}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">

        {/* Domain grid */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Beoordeling per domein</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {domains.map((domain, index) => {
              const dr = riskConfig(domain.scoreLabel)
              const DomainIcon = dr.icon
              const expanded = expandedDomains.has(index)
              return (
                <div key={domain.key ?? index}
                  className={`rounded-xl border-2 ${dr.border} ${dr.bgLight} overflow-hidden`}>
                  <button
                    className="w-full text-left p-4"
                    onClick={() => toggleDomain(index)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <DomainIcon className={`size-5 shrink-0 ${dr.text}`} />
                        <span className="font-semibold text-sm leading-tight">{domain.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${dr.badge}`}>
                          {domain.scoreLabel}
                        </span>
                        {expanded
                          ? <ChevronUp className="size-4 text-muted-foreground" />
                          : <ChevronDown className="size-4 text-muted-foreground" />
                        }
                      </div>
                    </div>
                    {domain.summary && (
                      <p className="mt-2 text-sm text-muted-foreground leading-snug">{domain.summary}</p>
                    )}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/50 pt-3">
                      {domain.indicatorsForRisk?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1.5">Risico-indicatoren</p>
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
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">Onafhankelijkheid</p>
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
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1.5">Aanbeveling</p>
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

        {/* Top improvements */}
        {(assessment.top_improvements as string[])?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Actiepunten</h2>
            </div>
            <div className="rounded-xl border bg-card divide-y">
              {(assessment.top_improvements as string[]).map((imp, i) => (
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

        {/* Follow-up vragen — aanvullende informatie */}
        {followUpQuestions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold">Analyse verfijnen</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Beantwoord de vragen hieronder om de analyse nauwkeuriger te maken. Vul in wat van toepassing is en klik op heranalyseer.
            </p>
            <div className="rounded-xl border bg-card divide-y">
              {followUpQuestions.map((q) => (
                <div key={q.key} className="px-5 py-4 space-y-2">
                  <label className="text-sm font-medium text-foreground">{q.question}</label>
                  <p className="text-xs text-muted-foreground">{q.hint}</p>
                  <textarea
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={2}
                    placeholder="Uw antwoord..."
                    value={answers[q.key] ?? ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                  />
                </div>
              ))}
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

        {/* Assignment draft — op aanvraag */}
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
                Genereer opdrachtomschrijving
              </button>
            )}
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            {draftLoading ? (
              <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin shrink-0" />
                <div>
                  <p className="font-medium">Opdrachtteksten worden gegenereerd...</p>
                  <p className="text-xs mt-0.5 text-muted-foreground/70">Dit duurt circa 15-20 seconden</p>
                </div>
              </div>
            ) : (compactDraft || longDraft) ? (
              <div>
                <div className="flex border-b">
                  <button
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'compact' ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('compact')}
                  >
                    Compact (modelovereenkomst)
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'long' ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('long')}
                  >
                    Uitgebreid (intern gebruik)
                  </button>
                </div>

                {activeTab === 'compact' && compactDraft && (
                  <div className="p-6 space-y-5">
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

                {activeTab === 'long' && longDraft && (
                  <div className="p-6 space-y-5">
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
                              <span className="shrink-0 mt-0.5">—</span>
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
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                Klik op &quot;Genereer opdrachtomschrijving&quot; om een professionele opdrachttekst te laten opstellen op basis van deze analyse.
              </div>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-800">
          <strong>Disclaimer:</strong> Deze analyse is een hulpmiddel en vervangt geen juridisch advies. De resultaten zijn indicatief. Raadpleeg altijd een juridisch specialist voor definitieve beoordeling.
        </div>

      </div>
    </div>
  )
}
