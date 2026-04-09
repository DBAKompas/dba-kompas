import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FALLBACK_DBA_ENGINE_OUTPUT, FALLBACK_DRAFT_OUTPUT } from '@/lib/ai/promptSecurity'

// ─── Mock @anthropic-ai/sdk ──────────────────────────────────────────────────
// vi.mock wordt gehoist vóór imports — mockCreate moet via vi.hoisted worden
// gedeclareerd zodat de factory-functie er toegang toe heeft.

const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ─── Imports NA de mock ───────────────────────────────────────────────────────

import { analyzeDbaText, generateAssignmentDraft } from '@/lib/ai/dbaAnalysis'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Genereert tekst van de gewenste lengte (ruimschoots boven beide drempels). */
function makeText(chars: number): string {
  const base = 'De opdrachtnemer voert werkzaamheden uit voor de opdrachtgever. '
  let result = ''
  while (result.length < chars) result += base
  return result.slice(0, chars)
}

const VALID_INPUT = makeText(1500) // ~210 woorden, 1500 chars — ruim boven minimum

/** Bouwt een Anthropic-achtig response-object met de gegeven tekst. */
function anthropicResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

/** Minimaal geldige DbaEngineOutput als JSON-string. */
const VALID_ENGINE_JSON = JSON.stringify({
  analysisStatus: 'complete',
  overallRiskLabel: 'midden',
  overallRiskColor: 'orange',
  overallSummary: 'Indicatieve analyse van de opdrachtomschrijving.',
  domains: [
    {
      key: 'aansturing',
      title: 'Aansturing en gezag',
      scoreLabel: 'midden',
      scoreColor: 'orange',
      summary: 'Gemengd beeld.',
      indicatorsForRisk: [],
      indicatorsForIndependence: [],
      suggestedImprovements: [],
    },
  ],
  directionalAssessment: {
    typeHint: 'projectmatige zelfstandige',
    directionSummary: 'Richting: zelfstandig.',
  },
  topImprovements: [],
  additionalImprovements: [],
  simulationHints: [],
  disclaimerShort: 'Indicatieve analyse, geen juridisch advies.',
  followUpQuestions: [],
})

/** Minimaal geldige DbaDraftOutput als JSON-string. */
const VALID_DRAFT_JSON = JSON.stringify({
  longAssignmentDraft: {
    title: 'Opdrachtomschrijving',
    assignmentDescription: 'De opdrachtnemer ontwikkelt een systeem.',
    deliverables: ['Werkend systeem'],
    acceptanceCriteria: [],
    scopeExclusions: [],
    dependenciesAndAssumptions: [],
    risksAndMitigations: [],
    executionAndSteering: 'Zelfstandig, rapportage op resultaat.',
  },
  compactAssignmentDraft: {
    title: 'Opdrachtomschrijving',
    assignmentDescription: 'De opdrachtnemer ontwikkelt een systeem.',
    deliverables: ['Werkend systeem'],
    executionAndSteering: 'Zelfstandig.',
  },
  reusableBuildingBlocks: {
    resultBullets: [],
    acceptanceBullets: [],
    independenceBullets: [],
    scopeBullets: [],
  },
  additionalImprovements: [],
  followUpQuestions: [],
})

// ─── analyzeDbaText ───────────────────────────────────────────────────────────

describe('analyzeDbaText', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('retourneert insufficient_input zonder Anthropic te bellen als tekst te kort is', async () => {
    const result = await analyzeDbaText('te kort')
    expect((result as { status: string }).status).toBe('insufficient_input')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('retourneert DbaEngineOutput bij geldige input + geldig JSON antwoord', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_ENGINE_JSON))
    const result = await analyzeDbaText(VALID_INPUT)
    expect((result as { analysisStatus: string }).analysisStatus).toBe('complete')
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('geeft het correcte overallRiskLabel terug uit de Anthropic response', async () => {
    const engineJson = JSON.stringify({
      ...JSON.parse(VALID_ENGINE_JSON),
      overallRiskLabel: 'hoog',
      overallRiskColor: 'red',
    })
    mockCreate.mockResolvedValueOnce(anthropicResponse(engineJson))
    const result = (await analyzeDbaText(VALID_INPUT)) as { overallRiskLabel: string }
    expect(result.overallRiskLabel).toBe('hoog')
  })

  it('herprobeert bij ongeldige JSON en retourneert correct resultaat na succesvolle retry', async () => {
    mockCreate
      .mockResolvedValueOnce(anthropicResponse('dit is geen json {'))
      .mockResolvedValueOnce(anthropicResponse(VALID_ENGINE_JSON))

    const result = await analyzeDbaText(VALID_INPUT)
    expect((result as { analysisStatus: string }).analysisStatus).toBe('complete')
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('retourneert FALLBACK als zowel eerste aanroep als retry ongeldig JSON retourneren', async () => {
    mockCreate
      .mockResolvedValueOnce(anthropicResponse('geen json'))
      .mockResolvedValueOnce(anthropicResponse('ook geen json'))

    const result = await analyzeDbaText(VALID_INPUT)
    // FALLBACK heeft analysisStatus: 'complete' en minimaal 1 domein
    expect((result as { analysisStatus: string }).analysisStatus).toBe(
      FALLBACK_DBA_ENGINE_OUTPUT.analysisStatus
    )
    expect((result as { domains: unknown[] }).domains.length).toBeGreaterThan(0)
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('retourneert FALLBACK als Anthropic een netwerkfout gooit', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Anthropic API unavailable'))
    const result = await analyzeDbaText(VALID_INPUT)
    expect((result as { analysisStatus: string }).analysisStatus).toBe(
      FALLBACK_DBA_ENGINE_OUTPUT.analysisStatus
    )
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('verwerkt code fences (```json ... ```) in de Anthropic response correct', async () => {
    const withFences = '```json\n' + VALID_ENGINE_JSON + '\n```'
    mockCreate.mockResolvedValueOnce(anthropicResponse(withFences))
    const result = await analyzeDbaText(VALID_INPUT)
    expect((result as { analysisStatus: string }).analysisStatus).toBe('complete')
  })

  it('voegt followUpQuestions toe op basis van signaaldetectie — zonder extra Anthropic-aanroep', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_ENGINE_JSON))
    const result = await analyzeDbaText(VALID_INPUT)
    expect(Array.isArray((result as { followUpQuestions: unknown[] }).followUpQuestions)).toBe(true)
    // Slechts 1 Anthropic aanroep — follow-up vragen komen uit signaaldetectie, niet van AI
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('accepteert optionele userBedrijfstak en userSpecialisatie zonder crash', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_ENGINE_JSON))
    const result = await analyzeDbaText(
      VALID_INPUT,
      'IT & Software Development',
      'Backend developer'
    )
    expect((result as { analysisStatus: string }).analysisStatus).toBe('complete')
  })

  it('coerceert een ongeldig overallRiskLabel naar midden', async () => {
    const withInvalidLabel = JSON.stringify({
      ...JSON.parse(VALID_ENGINE_JSON),
      overallRiskLabel: 'onbekend_label',
    })
    mockCreate.mockResolvedValueOnce(anthropicResponse(withInvalidLabel))
    const result = (await analyzeDbaText(VALID_INPUT)) as { overallRiskLabel: string }
    expect(result.overallRiskLabel).toBe('midden')
  })

  it('roept Anthropic aan met het juiste model', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_ENGINE_JSON))
    await analyzeDbaText(VALID_INPUT)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.model).toBe('claude-haiku-4-5-20251001')
  })

  it('roept Anthropic aan met max_tokens 2500', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_ENGINE_JSON))
    await analyzeDbaText(VALID_INPUT)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.max_tokens).toBe(2500)
  })
})

// ─── generateAssignmentDraft ──────────────────────────────────────────────────

describe('generateAssignmentDraft', () => {
  const analysisData = {
    overallRiskLabel: 'midden',
    typeHint: 'projectmatige zelfstandige',
    topImprovements: ['Voeg resultaatverplichting toe'],
    simulationFactState: {},
  }

  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('retourneert DbaDraftOutput in compact mode', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_DRAFT_JSON))
    const result = await generateAssignmentDraft(VALID_INPUT, analysisData, 'compact')
    expect(result.compactAssignmentDraft.title).toBe('Opdrachtomschrijving')
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('retourneert DbaDraftOutput in full mode', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_DRAFT_JSON))
    const result = await generateAssignmentDraft(VALID_INPUT, analysisData, 'full')
    expect(result.longAssignmentDraft).toBeDefined()
    expect(result.longAssignmentDraft.assignmentDescription).toBeTruthy()
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('compact mode gebruikt max_tokens 700', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_DRAFT_JSON))
    await generateAssignmentDraft(VALID_INPUT, analysisData, 'compact')
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.max_tokens).toBe(700)
  })

  it('full mode gebruikt max_tokens 2000', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_DRAFT_JSON))
    await generateAssignmentDraft(VALID_INPUT, analysisData, 'full')
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.max_tokens).toBe(2000)
  })

  it('compact is de standaard mode als geen mode opgegeven', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_DRAFT_JSON))
    await generateAssignmentDraft(VALID_INPUT, analysisData)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.max_tokens).toBe(700)
  })

  it('retourneert FALLBACK_DRAFT_OUTPUT als Anthropic een fout gooit', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Timeout'))
    const result = await generateAssignmentDraft(VALID_INPUT, analysisData)
    expect(result).toEqual(FALLBACK_DRAFT_OUTPUT)
  })

  it('retourneert FALLBACK als JSON ook na retry ongeldig blijft', async () => {
    mockCreate
      .mockResolvedValueOnce(anthropicResponse('geen json'))
      .mockResolvedValueOnce(anthropicResponse('ook geen json'))
    const result = await generateAssignmentDraft(VALID_INPUT, analysisData)
    expect(result.compactAssignmentDraft.title).toBe(
      FALLBACK_DRAFT_OUTPUT.compactAssignmentDraft.title
    )
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('retourneert reusableBuildingBlocks met alle vier arrays', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_DRAFT_JSON))
    const result = await generateAssignmentDraft(VALID_INPUT, analysisData, 'full')
    expect(Array.isArray(result.reusableBuildingBlocks.resultBullets)).toBe(true)
    expect(Array.isArray(result.reusableBuildingBlocks.acceptanceBullets)).toBe(true)
    expect(Array.isArray(result.reusableBuildingBlocks.independenceBullets)).toBe(true)
    expect(Array.isArray(result.reusableBuildingBlocks.scopeBullets)).toBe(true)
  })

  it('roept Anthropic aan met het juiste model', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse(VALID_DRAFT_JSON))
    await generateAssignmentDraft(VALID_INPUT, analysisData)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.model).toBe('claude-haiku-4-5-20251001')
  })
})
