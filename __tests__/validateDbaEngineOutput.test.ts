import { describe, it, expect } from 'vitest'
import {
  validateDbaEngineOutput,
  validateDbaDraftOutput,
  FALLBACK_DBA_ENGINE_OUTPUT,
  FALLBACK_DRAFT_OUTPUT,
  type DbaEngineOutput,
  type DbaDraftOutput,
} from '@/lib/ai/promptSecurity'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Minimaal geldig DbaEngineOutput object. */
function minimalEngineOutput(): DbaEngineOutput {
  return {
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
        indicatorsForRisk: ['werkt op aanwijzing'],
        indicatorsForIndependence: ['eigen werkwijze'],
        suggestedImprovements: ['Formuleer resultaatverplichting'],
      },
    ],
    directionalAssessment: {
      typeHint: 'projectmatige zelfstandige',
      directionSummary: 'Richting: zelfstandig met aandachtspunten.',
    },
    topImprovements: ['Voeg resultaatverplichting toe'],
    additionalImprovements: [],
    simulationHints: [],
    disclaimerShort: 'Indicatieve analyse, geen juridisch advies.',
    followUpQuestions: [],
  }
}

/** Minimaal geldig DbaDraftOutput object. */
function minimalDraftOutput(): DbaDraftOutput {
  return {
    longAssignmentDraft: {
      title: 'Opdrachtomschrijving',
      assignmentDescription: 'De opdrachtnemer ontwikkelt een systeem.',
      deliverables: ['Werkend systeem'],
      acceptanceCriteria: ['Akkoord van stuurgroep'],
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
      resultBullets: ['Oplevering werkend systeem'],
      acceptanceBullets: [],
      independenceBullets: [],
      scopeBullets: [],
    },
    additionalImprovements: [],
    followUpQuestions: [],
  }
}

// ─── validateDbaEngineOutput ─────────────────────────────────────────────────

describe('validateDbaEngineOutput', () => {
  it('accepteert een volledig geldig object', () => {
    const result = validateDbaEngineOutput(minimalEngineOutput())
    expect(result.success).toBe(true)
    expect(result.data?.analysisStatus).toBe('complete')
  })

  it('retourneert success:false voor null', () => {
    const result = validateDbaEngineOutput(null)
    expect(result.success).toBe(false)
  })

  it('retourneert success:false voor een string', () => {
    const result = validateDbaEngineOutput('geen object')
    expect(result.success).toBe(false)
  })

  it('retourneert success:false voor een getal', () => {
    const result = validateDbaEngineOutput(42)
    expect(result.success).toBe(false)
  })

  it('coerceert een object met ontbrekende velden (nuclear validator)', () => {
    // Object zonder domeinen en zonder directionalAssessment
    const partial = {
      analysisStatus: 'complete',
      overallRiskLabel: 'hoog',
      overallRiskColor: 'red',
      overallSummary: 'Analyse compleet.',
      // domains ontbreekt — wordt leeg array
      // directionalAssessment ontbreekt — wordt gecorced
    }
    const result = validateDbaEngineOutput(partial)
    expect(result.success).toBe(true)
    expect(result.data?.overallRiskLabel).toBe('hoog')
    expect(result.data?.overallRiskColor).toBe('red')
  })

  it('coerceert een onbekend riskLabel naar midden', () => {
    const invalid = {
      ...minimalEngineOutput(),
      overallRiskLabel: 'extreemhoog', // ongeldig
    }
    const result = validateDbaEngineOutput(invalid)
    expect(result.success).toBe(true)
    expect(result.data?.overallRiskLabel).toBe('midden')
  })

  it('coerceert een onbekend riskColor naar orange', () => {
    const invalid = {
      ...minimalEngineOutput(),
      overallRiskColor: 'purple', // ongeldig
    }
    const result = validateDbaEngineOutput(invalid)
    expect(result.success).toBe(true)
    expect(result.data?.overallRiskColor).toBe('orange')
  })

  it('accepteert alle drie geldige riskLabels', () => {
    for (const label of ['laag', 'midden', 'hoog'] as const) {
      const result = validateDbaEngineOutput({ ...minimalEngineOutput(), overallRiskLabel: label })
      expect(result.success).toBe(true)
      expect(result.data?.overallRiskLabel).toBe(label)
    }
  })

  it('accepteert alle drie geldige riskColors', () => {
    for (const color of ['green', 'orange', 'red'] as const) {
      const result = validateDbaEngineOutput({ ...minimalEngineOutput(), overallRiskColor: color })
      expect(result.success).toBe(true)
      expect(result.data?.overallRiskColor).toBe(color)
    }
  })

  it('coerceert een domain met ongeldig scoreLabel', () => {
    const withBadDomain = {
      ...minimalEngineOutput(),
      domains: [
        {
          key: 'aansturing',
          title: 'Test',
          scoreLabel: 'kritiek', // ongeldig
          scoreColor: 'orange',
          summary: 'Test',
          indicatorsForRisk: [],
          indicatorsForIndependence: [],
          suggestedImprovements: [],
        },
      ],
    }
    const result = validateDbaEngineOutput(withBadDomain)
    expect(result.success).toBe(true)
    // scoreLabel werd gecorced in coerceDomain via catch
    expect(result.data?.domains[0]).toBeDefined()
  })

  it('topImprovements wordt lege array als het ontbreekt', () => {
    const without = { ...minimalEngineOutput() }
    delete (without as Partial<DbaEngineOutput>).topImprovements
    const result = validateDbaEngineOutput(without)
    expect(result.success).toBe(true)
    expect(Array.isArray(result.data?.topImprovements)).toBe(true)
  })

  it('FALLBACK_DBA_ENGINE_OUTPUT passeert validatie', () => {
    const result = validateDbaEngineOutput(FALLBACK_DBA_ENGINE_OUTPUT)
    expect(result.success).toBe(true)
    expect(result.data?.analysisStatus).toBe('complete')
    expect(result.data?.domains.length).toBeGreaterThan(0)
  })

  it('leeg object wordt gecorced zonder crash', () => {
    const result = validateDbaEngineOutput({})
    expect(result.success).toBe(true)
    expect(result.data?.overallRiskLabel).toBe('midden') // fallback waarde
    expect(result.data?.overallRiskColor).toBe('orange')
  })
})

// ─── validateDbaDraftOutput ──────────────────────────────────────────────────

describe('validateDbaDraftOutput', () => {
  it('accepteert een volledig geldig object', () => {
    const result = validateDbaDraftOutput(minimalDraftOutput())
    expect(result.success).toBe(true)
    expect(result.data?.compactAssignmentDraft.title).toBe('Opdrachtomschrijving')
  })

  it('retourneert success:false voor null', () => {
    const result = validateDbaDraftOutput(null)
    expect(result.success).toBe(false)
  })

  it('retourneert success:false voor een string', () => {
    const result = validateDbaDraftOutput('geen object')
    expect(result.success).toBe(false)
  })

  it('coerceert een object met alleen compactAssignmentDraft', () => {
    const partial = {
      compactAssignmentDraft: {
        title: 'Compact',
        assignmentDescription: 'Omschrijving.',
        deliverables: ['Resultaat A'],
        executionAndSteering: 'Zelfstandig.',
      },
      // longAssignmentDraft en reusableBuildingBlocks ontbreken
    }
    const result = validateDbaDraftOutput(partial)
    expect(result.success).toBe(true)
    expect(result.data?.compactAssignmentDraft.title).toBe('Compact')
    expect(result.data?.longAssignmentDraft).toBeDefined()
    expect(result.data?.reusableBuildingBlocks).toBeDefined()
  })

  it('coerceert ontbrekende deliverables naar lege array', () => {
    const withoutDeliverables = {
      ...minimalDraftOutput(),
      compactAssignmentDraft: {
        title: 'Test',
        assignmentDescription: 'Omschrijving.',
        executionAndSteering: 'Zelfstandig.',
        // deliverables ontbreekt
      },
    }
    const result = validateDbaDraftOutput(withoutDeliverables)
    expect(result.success).toBe(true)
    expect(Array.isArray(result.data?.compactAssignmentDraft.deliverables)).toBe(true)
  })

  it('coerceert ontbrekende title naar fallback string', () => {
    const withoutTitle = {
      ...minimalDraftOutput(),
      compactAssignmentDraft: {
        assignmentDescription: 'Omschrijving.',
        deliverables: [],
        executionAndSteering: '',
        // title ontbreekt
      },
    }
    const result = validateDbaDraftOutput(withoutTitle)
    expect(result.success).toBe(true)
    expect(result.data?.compactAssignmentDraft.title).toBe('Opdrachtomschrijving')
  })

  it('FALLBACK_DRAFT_OUTPUT passeert validatie', () => {
    const result = validateDbaDraftOutput(FALLBACK_DRAFT_OUTPUT)
    expect(result.success).toBe(true)
  })

  it('leeg object wordt gecorced zonder crash', () => {
    const result = validateDbaDraftOutput({})
    expect(result.success).toBe(true)
    expect(result.data?.compactAssignmentDraft.title).toBe('Opdrachtomschrijving')
    expect(result.data?.longAssignmentDraft.title).toBe('Opdrachtomschrijving')
  })

  it('additionalImprovements is altijd een array', () => {
    const result = validateDbaDraftOutput({ ...minimalDraftOutput(), additionalImprovements: null })
    expect(result.success).toBe(true)
    expect(Array.isArray(result.data?.additionalImprovements)).toBe(true)
  })

  it('reusableBuildingBlocks heeft altijd alle vier arrays', () => {
    const result = validateDbaDraftOutput(minimalDraftOutput())
    expect(result.success).toBe(true)
    const rbb = result.data?.reusableBuildingBlocks
    expect(Array.isArray(rbb?.resultBullets)).toBe(true)
    expect(Array.isArray(rbb?.acceptanceBullets)).toBe(true)
    expect(Array.isArray(rbb?.independenceBullets)).toBe(true)
    expect(Array.isArray(rbb?.scopeBullets)).toBe(true)
  })
})
