import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { validateDbaEngineOutput, DBA_SCORING_SYSTEM_PROMPT, FALLBACK_DBA_ENGINE_OUTPUT } from '@/lib/ai/promptSecurity'

export const maxDuration = 120

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY niet ingesteld' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Stap 1: basistest
    const basicResponse = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Zeg alleen: {"status": "ok"}' }],
    })
    const basicText = basicResponse.content[0].type === 'text' ? basicResponse.content[0].text : ''

    // Stap 2: vraag een minimale DBA-structuur
    const structTest = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 200,
      system: 'Je geeft altijd JSON terug, geen uitleg.',
      messages: [{
        role: 'user',
        content: 'Geef een JSON object met exact deze velden: analysisStatus (waarde: "complete"), overallRiskLabel (waarde: "hoog"), overallRiskColor (waarde: "red"), overallSummary (string). Geen andere tekst.'
      }],
    })
    const structText = structTest.content[0].type === 'text' ? structTest.content[0].text : ''

    let structParsed: unknown = null
    let structParseError: string | null = null
    try {
      structParsed = JSON.parse(structText)
    } catch (e) {
      structParseError = e instanceof Error ? e.message : String(e)
    }

    // Controleer of de fallback herkend kan worden
    const isFallback = (obj: unknown) => {
      if (!obj || typeof obj !== 'object') return false
      const o = obj as Record<string, unknown>
      return o.overallSummary === FALLBACK_DBA_ENGINE_OUTPUT.overallSummary
    }

    return NextResponse.json({
      step1_basicApi: { working: true, response: basicText },
      step2_structTest: {
        rawResponse: structText,
        parseError: structParseError,
        parsedKeys: structParsed && typeof structParsed === 'object' ? Object.keys(structParsed as object) : [],
      },
      fallbackSummary: FALLBACK_DBA_ENGINE_OUTPUT.overallSummary,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : 'unknown',
    }, { status: 500 })
  }
}
