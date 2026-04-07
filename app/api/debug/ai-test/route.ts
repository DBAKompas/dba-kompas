import { NextResponse } from 'next/server'
import { analyzeDbaText } from '@/lib/ai'

export const maxDuration = 120

const SAMPLE_INPUT = `Ik ben zelfstandig software ontwikkelaar en voer momenteel een opdracht uit voor een grote Nederlandse bank in Amsterdam. De opdracht loopt al 18 maanden en ik werk gemiddeld 32 uur per week op hun kantoor aan de Zuidas. Mijn uurtarief bedraagt 95 euro exclusief BTW. Mijn dagelijkse werkzaamheden en prioriteiten worden bepaald door de product owner en teamleider van de bank. Elke ochtend neem ik deel aan een standup meeting waarbij ik verantwoording afleg over mijn voortgang. Ik werk uitsluitend op de laptop en met de development tools van de opdrachtgever. Toegang tot hun interne systemen verloopt via hun beveiligde omgeving. De opdracht betreft het bouwen en onderhouden van een nieuw klantportaal in React en TypeScript, als onderdeel van een groter agile team van vaste medewerkers en andere contractors. Ik rapporteer dagelijks over voortgang aan de teamleider en er wordt van mij verwacht dat ik aanwezig ben tijdens kantooruren van 09:00 tot 17:00. Ik heb op dit moment geen andere opdrachtgevers. Alle werkzaamheden vinden uitsluitend plaats bij de opdrachtgever. Mijn eigen investeringen beperken zich tot mijn KvK-inschrijving. Er is geen sprake van een eigen resultaatverplichting of afgesproken oplevering.`

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
