import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { validateDbaEngineOutput, DBA_SCORING_SYSTEM_PROMPT } from '@/lib/ai/promptSecurity'

export const maxDuration = 120

const SAMPLE_INPUT = `Ik ben software ontwikkelaar en werk als zzp'er voor een groot financieel bedrijf. De opdracht loopt al 18 maanden en ik werk 32 uur per week op hun kantoor. Ik heb een uurtarief van €85. Mijn dagelijkse taken worden bepaald door de teamleider van het bedrijf, die elke ochtend een standup meeting organiseert. Ik gebruik hun laptop en tools. De opdracht betreft het bouwen van een nieuw klantportaal. Ik heb geen andere opdrachtgevers op dit moment.`

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY niet ingesteld' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Stap 1: Test Haiku model simpel
    let haikuBasicText = ''
    let haikuBasicError: string | null = null
    try {
      const r = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Geef alleen terug: {"ok": true}' }],
      })
      haikuBasicText = r.content[0].type === 'text' ? r.content[0].text : ''
    } catch (e) {
      haikuBasicError = e instanceof Error ? e.message : String(e)
    }

    // Stap 2: Test minimale DBA JSON met Haiku
    let haikuMiniText = ''
    let haikuMiniError: string | null = null
    let haikuMiniParsed: unknown = null
    let haikuMiniValidation: { success: boolean; error?: string } | null = null
    try {
      const r = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: DBA_SCORING_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Analyseer deze opdracht en geef ALLEEN valid JSON terug (geen andere tekst):

OPDRACHT: ${SAMPLE_INPUT}

Geef JSON terug met EXACT deze structuur:
{
  "analysisStatus": "complete",
  "overallRiskLabel": "laag"|"midden"|"hoog",
  "overallRiskColor": "green"|"orange"|"red",
  "overallSummary": "1-2 zinnen",
  "domains": [
    {"key":"aansturing","title":"Aansturing, gezag en organisatorische inbedding","scoreLabel":"laag"|"midden"|"hoog","scoreColor":"green"|"orange"|"red","summary":"1 zin","indicatorsForRisk":[],"indicatorsForIndependence":[],"suggestedImprovements":[]},
    {"key":"eigen_rekening_risico","title":"Werken voor eigen rekening en risico","scoreLabel":"laag"|"midden"|"hoog","scoreColor":"green"|"orange"|"red","summary":"1 zin","indicatorsForRisk":[],"indicatorsForIndependence":[],"suggestedImprovements":[]},
    {"key":"ondernemerschap","title":"Extern ondernemerschap","scoreLabel":"laag"|"midden"|"hoog","scoreColor":"green"|"orange"|"red","summary":"1 zin","indicatorsForRisk":[],"indicatorsForIndependence":[],"suggestedImprovements":[]}
  ],
  "engagementDurationModule":{"monthsAtClient":18,"averageHoursPerWeekBand":"24-32","summary":"1 zin"},
  "directionalAssessment":{"typeHint":"embedded specialist","directionSummary":"1-2 zinnen"},
  "topImprovements":["verbeterpunt 1","verbeterpunt 2"],
  "additionalImprovements":[],
  "simulationFactState":{"aanstuuringNiveau":"hoog","inhoudelijkToezicht":"hoog","teaminbedding":"hoog","werkplekAfhankelijkheid":"hoog","kernactiviteit":true,"lijnfunctie":false,"tijdelijkeVervanging":false,"paymentType":"uurtarief","resultaatverplichting":"vaag","acceptatiecriteria":false,"herstelEigenRekening":false,"aansprakelijkheid":false,"investeringen":"laag","aantalOpdrachtgevers":"een","acquisitie":false,"eigenBranding":false,"eigenVoorwaarden":false,"tijdelijkeAard":false,"praktijkWijktAf":false},
  "simulationHints":[],
  "disclaimerShort":"Indicatieve analyse, geen juridisch advies.",
  "followUpQuestions":[]
}`
        }],
      })
      haikuMiniText = r.content[0].type === 'text' ? r.content[0].text : ''

      // Try to clean and parse
      let clean = haikuMiniText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      if (!clean.startsWith('{')) {
        const match = clean.match(/\{[\s\S]*\}/)
        clean = match ? match[0] : clean
      }
      haikuMiniParsed = JSON.parse(clean)
      haikuMiniValidation = validateDbaEngineOutput(haikuMiniParsed)
    } catch (e) {
      haikuMiniError = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      step1_haiku_basic: {
        modelWorking: !haikuBasicError,
        response: haikuBasicText,
        error: haikuBasicError,
      },
      step2_haiku_mini_dba: {
        rawResponse: haikuMiniText.slice(0, 500),
        rawLength: haikuMiniText.length,
        parseError: haikuMiniError,
        parsedKeys: haikuMiniParsed && typeof haikuMiniParsed === 'object' ? Object.keys(haikuMiniParsed as object) : [],
        validationSuccess: haikuMiniValidation?.success ?? false,
        validationError: haikuMiniValidation?.error,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
