'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

interface Assessment {
  id: string
  overall_risk_color: string
  overall_risk_label: string
  overall_summary: string
  domains: Domain[]
  top_improvements: string[]
  compact_assignment_draft: string | object
  optimized_brief: string | object
  created_at: string
}

function getRiskColor(level: string) {
  switch (level?.toLowerCase()) {
    case 'laag':
      return 'bg-green-100 text-green-800'
    case 'medium':
    case 'gemiddeld':
      return 'bg-amber-100 text-amber-800'
    case 'hoog':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRiskIcon(level: string) {
  switch (level?.toLowerCase()) {
    case 'laag':
      return ShieldCheck
    case 'medium':
    case 'gemiddeld':
      return Shield
    case 'hoog':
      return ShieldAlert
    default:
      return Shield
  }
}

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'compact' | 'long'>('compact')

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/dba/assessments/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Analyse niet gevonden')
        return res.json()
      })
      .then((data) => {
        setAssessment(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [params.id])

  const toggleDomain = (index: number) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          {error || 'Analyse niet gevonden'}
        </div>
        <Button variant="outline" asChild>
          <Link href="/analyse">
            <ArrowLeft className="size-4" />
            Terug naar analyses
          </Link>
        </Button>
      </div>
    )
  }

  const RiskIcon = getRiskIcon(assessment.overall_risk_label)

  // compact_assignment_draft en optimized_brief zijn JSON-strings in de DB
  const compactText = typeof assessment.compact_assignment_draft === 'string'
    ? (() => { try { return JSON.parse(assessment.compact_assignment_draft as string) } catch { return assessment.compact_assignment_draft } })()
    : assessment.compact_assignment_draft
  const longText = typeof assessment.optimized_brief === 'string'
    ? (() => { try { return JSON.parse(assessment.optimized_brief as string) } catch { return assessment.optimized_brief } })()
    : assessment.optimized_brief

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/analyse">
            <ArrowLeft className="size-4" />
            Terug naar analyses
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <a href={`/api/dba/assessments/${params.id}/pdf`} download>
            <Download className="size-4" />
            Download PDF
          </a>
        </Button>
      </div>

      {/* Overall score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analyse Resultaat</CardTitle>
              <CardDescription>
                Uitgevoerd op{' '}
                {assessment.created_at
                  ? new Date(assessment.created_at).toLocaleDateString('nl-NL')
                  : 'onbekend'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <RiskIcon className="size-8" />
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${getRiskColor(
                    assessment.overall_risk_label
                  )}`}
                >
                  {assessment.overall_risk_label}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{assessment.overall_summary}</p>
        </CardContent>
      </Card>

      {/* Domain cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Domeinen</h2>
        {(assessment.domains as Domain[])?.map((domain, index) => {
          const expanded = expandedDomains.has(index)
          const DomainRiskIcon = getRiskIcon(domain.scoreLabel)
          return (
            <Card key={domain.key ?? index}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleDomain(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DomainRiskIcon className="size-5" />
                    <CardTitle>{domain.title}</CardTitle>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskColor(
                        domain.scoreLabel
                      )}`}
                    >
                      {domain.scoreLabel}
                    </span>
                  </div>
                  {expanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
                {!expanded && domain.summary && (
                  <CardDescription className="mt-1">{domain.summary}</CardDescription>
                )}
              </CardHeader>
              {expanded && (
                <CardContent className="space-y-4">
                  {domain.summary && (
                    <p className="text-sm text-muted-foreground">{domain.summary}</p>
                  )}
                  {domain.indicatorsForRisk?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Risico-indicatoren</h4>
                      <ul className="space-y-1">
                        {domain.indicatorsForRisk.map((indicator, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {domain.indicatorsForIndependence?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Onafhankelijkheidsindicatoren</h4>
                      <ul className="space-y-1">
                        {domain.indicatorsForIndependence.map((indicator, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <ShieldCheck className="mt-0.5 size-3 shrink-0 text-green-500" />
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {domain.suggestedImprovements?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Verbeteringen</h4>
                      <ul className="space-y-1">
                        {domain.suggestedImprovements.map((improvement, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Lightbulb className="mt-0.5 size-3 shrink-0 text-blue-500" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Top improvements */}
      {(assessment.top_improvements as string[])?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-5 text-blue-500" />
              Top verbeteringen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5">
              {(assessment.top_improvements as string[]).map((improvement, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {improvement}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Assignment drafts */}
      {(compactText || longText) && (
        <Card>
          <CardHeader>
            <CardTitle>Opdrachtformulering</CardTitle>
            <CardDescription>
              Voorbeeldteksten voor uw overeenkomst
            </CardDescription>
            <div className="flex gap-2 pt-2">
              <Button
                variant={activeTab === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('compact')}
              >
                Compact
              </Button>
              <Button
                variant={activeTab === 'long' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('long')}
              >
                Uitgebreid
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
              {activeTab === 'compact'
                ? (typeof compactText === 'object' ? JSON.stringify(compactText, null, 2) : String(compactText ?? ''))
                : (typeof longText === 'object' ? JSON.stringify(longText, null, 2) : String(longText ?? ''))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <strong>Disclaimer:</strong> Deze analyse is een hulpmiddel en vervangt geen juridisch
        advies. De resultaten zijn indicatief. Raadpleeg altijd een juridisch specialist voor
        definitieve beoordeling.
      </div>
    </div>
  )
}
