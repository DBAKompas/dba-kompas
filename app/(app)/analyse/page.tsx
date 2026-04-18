'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import BrandLogo from '@/components/marketing/BrandLogo'
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  ChevronRight,
} from 'lucide-react'

// ── DBA kernsignalen voor realtime client-side detectie ──────────────────────
const DBA_SIGNALEN = [
  { regex: /zelfstand/i, label: 'Zelfstandige uitvoering' },
  { regex: /eigen risico/i, label: 'Eigen risico' },
  { regex: /factuur|factureer/i, label: 'Facturering' },
  { regex: /eigen gereedschap|eigen materiaal|eigen apparatuur/i, label: 'Eigen middelen' },
  { regex: /vrije vervanging|vervang/i, label: 'Vrije vervanging' },
  { regex: /meerdere opdrachtgever|andere opdrachtgever/i, label: 'Meerdere opdrachtgevers' },
  { regex: /resultaat|deliverable|oplevering/i, label: 'Resultaatsverbintenis' },
  { regex: /eigen werkwijze|eigen methode|eigen planning/i, label: 'Eigen werkwijze' },
  { regex: /geen gezag|zonder toezicht/i, label: 'Geen gezagsverhouding' },
  { regex: /btw|kvk|handelsregister|kvk-nummer/i, label: 'Ondernemersregistratie' },
]

// ── Disclaimer localStorage key ──────────────────────────────────────────────
const DISCLAIMER_KEY = 'dba_disclaimer_v1'

// ── Laadstappen animatie teksten ─────────────────────────────────────────────
const LOADING_STEPS = [
  'Tekst wordt geanalyseerd...',
  'DBA-criteria worden getoetst...',
  'Risico-indicatoren in kaart...',
  'Aanbevelingen worden opgesteld...',
  'Rapport wordt afgerond...',
]

// ── Types ────────────────────────────────────────────────────────────────────
type InputMode = 'text' | 'file' | null
type WizardStep = 'input' | 'confirm'
type PageTab = 'nieuw' | 'eerder'

interface AnalyseSummary {
  id: string
  overall_risk_label: string
  overall_summary: string
  created_at: string
}

// ── Laadscherm component ─────────────────────────────────────────────────────
function LoadingScreen({ stepIdx }: { stepIdx: number }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8">

        {/* Logo */}
        <BrandLogo variant="dark" className="h-8 w-auto opacity-70" />

        {/* Spinner */}
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>

        {/* Steps — gecentreerd blok */}
        <div className="flex flex-col items-start gap-3">
          {LOADING_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`size-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  i < stepIdx
                    ? 'bg-emerald-500'
                    : i === stepIdx
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted'
                }`}
              >
                {i < stepIdx ? (
                  <Check className="size-3 text-white" />
                ) : i === stepIdx ? (
                  <Loader2 className="size-3 text-white animate-spin" />
                ) : null}
              </div>
              <span
                className={`text-sm transition-colors ${
                  i < stepIdx
                    ? 'text-muted-foreground line-through'
                    : i === stepIdx
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground/40'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Gemiddeld 15–30 seconden
        </p>
      </div>
    </div>
  )
}

// ── Risicokleur helper ───────────────────────────────────────────────────────
function riskBadge(label: string) {
  switch (label?.toLowerCase()) {
    case 'laag':
      return { bg: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck }
    case 'hoog':
      return { bg: 'bg-red-100 text-red-700', icon: ShieldAlert }
    default:
      return { bg: 'bg-amber-100 text-amber-700', icon: Shield }
  }
}

// ── Eerdere analyses tab ─────────────────────────────────────────────────────
function EerdereAnalyses({
  loading,
  analyses,
}: {
  loading: boolean
  analyses: AnalyseSummary[]
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center">
        <FileText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nog geen analyses uitgevoerd</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Start een nieuwe analyse via het tabblad hierboven
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
      {analyses.map((a) => {
        const badge = riskBadge(a.overall_risk_label)
        const Icon = badge.icon
        return (
          <Link
            key={a.id}
            href={`/analyse/${a.id}`}
            className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="size-4 shrink-0 text-muted-foreground/50" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.overall_summary
                    ? a.overall_summary.slice(0, 60) + (a.overall_summary.length > 60 ? '…' : '')
                    : 'DBA analyse'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(a.created_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg}`}>
                {a.overall_risk_label ?? 'Gemiddeld'}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Hoofdpagina ──────────────────────────────────────────────────────────────
export default function AnalysePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Wizard state
  const [tab, setTab] = useState<PageTab>('nieuw')
  const [step, setStep] = useState<WizardStep>('input')
  const [inputMode, setInputMode] = useState<InputMode>(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isTypingActive, setIsTypingActive] = useState(false)

  // Disclaimer state
  const [hasAcceptedBefore, setHasAcceptedBefore] = useState(false)
  const [disclaimerChecks, setDisclaimerChecks] = useState([false, false, false])

  // Loading / error
  const [loading, setLoading] = useState(false)
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Eerdere analyses
  const [analyses, setAnalyses] = useState<AnalyseSummary[]>([])
  const [analysesLoading, setAnalysesLoading] = useState(false)
  const [analysesLoaded, setAnalysesLoaded] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasAcceptedBefore(localStorage.getItem(DISCLAIMER_KEY) === 'true')
    }
  }, [])

  // Load eerdere analyses on tab switch
  useEffect(() => {
    if (tab === 'eerder' && !analysesLoaded) {
      setAnalysesLoading(true)
      fetch('/api/dba/assessments')
        .then((res) => res.json())
        .then((data) => {
          setAnalyses(Array.isArray(data) ? data : [])
          setAnalysesLoading(false)
          setAnalysesLoaded(true)
        })
        .catch(() => {
          setAnalysesLoading(false)
          setAnalysesLoaded(true)
        })
    }
  }, [tab, analysesLoaded])

  // Loading step animation
  useEffect(() => {
    if (!loading) {
      setLoadingStepIdx(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 1800)
    return () => clearInterval(interval)
  }, [loading])

  // Realtime element detection
  const foundSignalen = DBA_SIGNALEN.filter((s) => s.regex.test(text))
  const foundCount = foundSignalen.length
  const totalSignalen = DBA_SIGNALEN.length
  const unfoundSignalen = DBA_SIGNALEN.filter((s) => !s.regex.test(text))

  // Stats
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length
  const minChars = 120

  // Validatie
  const canProceedText = inputMode === 'text' && text.trim().length >= minChars
  const canProceedFile = inputMode === 'file' && file !== null
  const canProceed = canProceedText || canProceedFile
  const allDisclaimerChecked = disclaimerChecks.every(Boolean)
  const canStart = hasAcceptedBefore || allDisclaimerChecked

  // File handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setInputMode('file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      setFile(dropped)
      setInputMode('file')
    }
  }

  // Navigate to stap 2
  const handleNext = () => {
    setError(null)
    setStep('confirm')
  }

  // Start analyse
  const handleStart = async () => {
    if (!hasAcceptedBefore) {
      localStorage.setItem(DISCLAIMER_KEY, 'true')
      setHasAcceptedBefore(true)
    }
    setLoading(true)
    setError(null)
    try {
      let response: Response
      if (inputMode === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        response = await fetch('/api/documents', { method: 'POST', body: formData })
      } else {
        response = await fetch('/api/dba/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputText: text }),
        })
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Er is een fout opgetreden')
      }
      const data = await response.json()
      router.push(`/analyse/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen stepIdx={loadingStepIdx} />

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analyse</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Controleer uw overeenkomst op DBA-compliance
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setTab('nieuw'); setStep('input') }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'nieuw'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Nieuwe analyse
        </button>
        <button
          onClick={() => setTab('eerder')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'eerder'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Eerdere analyses
        </button>
      </div>

      {/* ── Tab: eerdere analyses ── */}
      {tab === 'eerder' && (
        <EerdereAnalyses loading={analysesLoading} analyses={analyses} />
      )}

      {/* ── Tab: nieuwe analyse ── */}
      {tab === 'nieuw' && (
        <>
          {/* Stap indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'input' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'input' ? 'bg-primary text-primary-foreground' : 'bg-emerald-500 text-white'}`}>
                {step === 'input' ? '1' : <Check className="size-3" />}
              </div>
              Invoer
            </div>
            <div className="flex-1 h-px bg-border max-w-[40px]" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'confirm' ? 'text-primary' : 'text-muted-foreground/50'}`}>
              <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'confirm' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              Bevestigen
            </div>
          </div>

          {/* ── Stap 1: Invoer ── */}
          {step === 'input' && (
            <div className="space-y-5">
              {/* Twee invoertegels */}
              {inputMode === null && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setInputMode('text')}
                    className="group rounded-xl border-2 border-border bg-card p-6 text-left hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <FileText className="size-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                    <p className="font-semibold text-foreground">Plak tekst</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Kopieer de tekst van uw overeenkomst en plak die hier in
                    </p>
                  </button>
                  <button
                    onClick={() => { setInputMode('file'); setTimeout(() => fileInputRef.current?.click(), 50) }}
                    className="group rounded-xl border-2 border-border bg-card p-6 text-left hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                    <p className="font-semibold text-foreground">Upload bestand</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Upload een PDF of DOCX bestand van uw overeenkomst
                    </p>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Invoermodus: tekst */}
              {inputMode === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Tekst invoeren</p>
                    <button
                      onClick={() => { setInputMode(null); setText('') }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Andere methode kiezen
                    </button>
                  </div>

                  {/* Textarea met oranje border bij actief typen */}
                  <textarea
                    className={`min-h-[220px] w-full rounded-xl border-2 bg-card px-4 py-3 text-sm outline-none transition-colors resize-none leading-relaxed ${
                      isTypingActive
                        ? 'border-orange-400 ring-2 ring-orange-400/20'
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                    placeholder="Plak hier de tekst van uw overeenkomst of opdrachtbeschrijving…"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value)
                      setIsTypingActive(true)
                    }}
                    onFocus={() => setIsTypingActive(true)}
                    onBlur={() => setIsTypingActive(false)}
                  />

                  {/* Tekstteller */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{charCount} tekens · {wordCount} woorden</span>
                    {charCount > 0 && charCount < minChars && (
                      <span className="text-amber-600">Minimaal {minChars} tekens vereist</span>
                    )}
                  </div>

                  {/* Realtime element detectie */}
                  {text.trim().length >= 20 && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          Kernsignalen herkend
                        </span>
                        <span className={`font-bold ${foundCount >= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {foundCount} / {totalSignalen}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            foundCount >= 7
                              ? 'bg-emerald-500'
                              : foundCount >= 4
                              ? 'bg-amber-500'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${(foundCount / totalSignalen) * 100}%` }}
                        />
                      </div>

                      {/* Herkende signalen */}
                      {foundCount > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {foundSignalen.map((s) => (
                            <span
                              key={s.label}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                            >
                              <Check className="size-2.5" />
                              {s.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Niet-herkende signalen als tip */}
                      {unfoundSignalen.length > 0 && foundCount > 0 && (
                        <div>
                          <p className="text-[11px] text-muted-foreground font-medium mb-1.5">
                            Tip: voeg ook toe:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {unfoundSignalen.slice(0, 5).map((s) => (
                              <span
                                key={s.label}
                                className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                              >
                                {s.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Invoermodus: bestand */}
              {inputMode === 'file' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Bestand uploaden</p>
                    <button
                      onClick={() => { setInputMode(null); setFile(null) }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Andere methode kiezen
                    </button>
                  </div>

                  <div
                    className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                      dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {file ? (
                      <div className="flex items-center gap-3 px-6">
                        <FileText className="size-8 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          className="ml-2 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setFile(null) }}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="size-9 text-muted-foreground/40" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Sleep een bestand hierheen of klik om te uploaden
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">PDF of DOCX · max. 10 MB</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Privacy blok */}
              {inputMode !== null && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border/60 px-4 py-3">
                  <Lock className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Bescherm je privacy</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                      Uw tekst wordt verwerkt via beveiligde servers en uitsluitend gebruikt voor deze analyse.
                      Gegevens worden na 14 dagen automatisch verwijderd.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Volgende knop */}
              {inputMode !== null && (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canProceed}
                  onClick={handleNext}
                >
                  Volgende: controleren
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* ── Stap 2: Bevestigen ── */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <button
                onClick={() => setStep('input')}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Terug naar invoer
              </button>

              {/* Samenvatting */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-base font-semibold">Wat u krijgt na de analyse</h2>
                <div className="space-y-2.5">
                  {[
                    'Volledig DBA-risicooordeel (laag / gemiddeld / hoog)',
                    'Analyse per domein: gezag, eigen risico, persoonlijke arbeid',
                    'Concrete verbeterpunten voor uw overeenkomst',
                    'Professionele opdrachtomschrijving op maat',
                    'Mogelijkheid tot verfijning met aanvullende informatie',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoer samenvatting */}
              {inputMode === 'text' && (
                <div className="rounded-xl border border-border bg-muted/30 px-5 py-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Uw invoer</p>
                  <p className="text-sm text-foreground line-clamp-2">{text.slice(0, 120)}{text.length > 120 ? '…' : ''}</p>
                  <p className="text-xs text-muted-foreground mt-1">{charCount} tekens · {wordCount} woorden · {foundCount} kernsignalen</p>
                </div>
              )}
              {inputMode === 'file' && file && (
                <div className="rounded-xl border border-border bg-muted/30 px-5 py-3 flex items-center gap-3">
                  <FileText className="size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}

              {/* Disclaimer — alleen eerste keer */}
              {!hasAcceptedBefore && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-800">Bevestig voordat u start</p>
                  </div>
                  {[
                    'Ik begrijp dat deze analyse indicatief is en geen juridisch advies vervangt. Voor definitieve beoordeling raadpleeg ik altijd een specialist.',
                    'Ik ga akkoord met de verwerking van mijn gegevens conform het privacybeleid. Mijn invoer wordt na 14 dagen automatisch verwijderd.',
                    'Ik bevestig dat ik bevoegd ben om deze tekst te analyseren en dat er geen gevoelige persoonsgegevens in staan.',
                  ].map((label, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                      <div
                        onClick={() => setDisclaimerChecks((prev) => {
                          const next = [...prev]; next[i] = !next[i]; return next
                        })}
                        className={`mt-0.5 size-4 shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                          disclaimerChecks[i]
                            ? 'bg-amber-600 border-amber-600'
                            : 'border-amber-400 hover:border-amber-600'
                        }`}
                      >
                        {disclaimerChecks[i] && <Check className="size-2.5 text-white" />}
                      </div>
                      <span className="text-sm text-amber-800 leading-relaxed">{label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Start knop */}
              <Button
                className="w-full"
                size="lg"
                disabled={!canStart}
                onClick={handleStart}
              >
                <ShieldCheck className="size-4" />
                Analyse starten
              </Button>

              {hasAcceptedBefore && (
                <p className="text-center text-xs text-muted-foreground">
                  U heeft eerder de gebruiksvoorwaarden geaccepteerd.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
