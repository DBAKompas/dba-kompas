import { NextResponse } from 'next/server'
import { analyzeDbaText } from '@/lib/ai'

export const maxDuration = 120

const SAMPLE_INPUT = `Ik ben software ontwikkelaar en werk als zzp'er voor een groot financieel bedrijf in Amsterdam. De opdracht loopt al 18 maanden en ik werk gemiddeld 32 uur per week op hun kantoor. Ik heb een uurtarief van 85 euro exclusief BTW. Mijn dagelijkse werkzaamheden worden bepaald door de teamleider van het bedrijf, die elke ochtend een standup meeting organiseert. Ik gebruik hun laptop en development tools. De opdracht betreft het bouwen van een nieuw klantportaal in React en TypeScript. Ik rapporteer dagelijks over voortgang en er wordt van mij verwacht dat ik aanwezig ben tijdens kantooruren. Ik heb geen andere opdrachtgevers op dit moment en alle werkzaamheden vinden plaats bij de opdrachtgever.`

export async function GET() {
  try {
    const startTime = Date.now()
    const result = await analyzeDbaText(SAMPLE_INPUT)
    const duration = Date.now() - startTime

    const isFallback = 'overallSummary' in result &&
      (result as Record<string, unknown>).overallSummary === 'Analyse kon niet worden voltooid vanwege een technisch probleem. Probeer het opnieuw.'

    return NextResponse.json({
      duration_ms: duration,
      is_fallback: isFallback,
      result_summary: 'overallSummary' in result ? {
        status: (result as Record<string, unknown>).analysisStatus,
        riskLabel: (result as Record<string, unknown>).overallRiskLabel,
        riskColor: (result as Record<string, unknown>).overallRiskColor,
        summary: ((result as Record<string, unknown>).overallSummary as string)?.slice(0, 150),
        domainsCount: Array.isArray((result as Record<string, unknown>).domains) ? ((result as Record<string, unknown>).domains as unknown[]).length : 0,
        topImprovementsCount: Array.isArray((result as Record<string, unknown>).topImprovements) ? ((result as Record<string, unknown>).topImprovements as unknown[]).length : 0,
      } : result,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
