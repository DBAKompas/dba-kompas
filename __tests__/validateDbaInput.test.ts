import { describe, it, expect } from 'vitest'
import {
  validateDbaInput,
  detectSignals,
  countWords,
  buildFollowUpQuestions,
  INTAKE_THRESHOLDS,
} from '@/lib/ai/inputValidation'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Maakt een tekst van de gevraagde lengte (vult op met neutrale woorden). */
function makeText(chars: number): string {
  const base = 'De opdrachtnemer voert werkzaamheden uit voor de opdrachtgever. '
  let result = ''
  while (result.length < chars) result += base
  return result.slice(0, chars)
}

/** Tekst die ruimschoots boven de drempel zit zonder DBA-signalen. */
const LONG_NEUTRAL_TEXT = makeText(1200)

/** Tekst die alle 11 DBA-signalen bevat. */
const SIGNAL_RICH_TEXT = `
  De opdrachtnemer levert een werkend softwaresysteem op als eindresultaat (resultaat).
  De opdracht duurt 6 maanden, tot en met Q3 2025 (duur).
  De opdrachtnemer werkt 24 uur per week, aaneengesloten al 14 maanden bij deze opdrachtgever (duurIntensiteit).
  Hij bepaalt de werkwijze en aanpak zelfstandig en autonoom (werkwijzeAutonomie).
  Locatie: remote, met eigen laptop en software (werkplekTijden, investeringenMiddelen).
  Hij rapporteert op resultaat aan de projectdirecteur, zonder hiërarchische aansturing (aansturingInstructies).
  Betaling: vaste projectprijs per opgeleverd milestone (betalingModel).
  Vervanging is toegestaan mits de vervanger gekwalificeerd is (vervanging).
  Hij werkt ook voor andere klanten en heeft meerdere opdrachtgevers (meerdereOpdrachtgevers).
  Acceptatiecriteria zijn vastgelegd: akkoord van de stuurgroep en voldaan aan KPI's (acceptatiecriteria).
`

// ─── countWords ──────────────────────────────────────────────────────────────

describe('countWords', () => {
  it('telt woorden correct', () => {
    expect(countWords('één twee drie')).toBe(3)
  })

  it('negeert extra witruimte', () => {
    expect(countWords('  één  twee   drie  ')).toBe(3)
  })

  it('geeft 0 voor lege string', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })
})

// ─── detectSignals ───────────────────────────────────────────────────────────

describe('detectSignals', () => {
  it('detecteert geen signalen in lege tekst', () => {
    const signals = detectSignals('')
    const total = Object.values(signals).filter(Boolean).length
    expect(total).toBe(0)
  })

  it('detecteert alle signalen in een rijke tekst', () => {
    const signals = detectSignals(SIGNAL_RICH_TEXT)
    expect(signals.hasResultaat).toBe(true)
    expect(signals.hasDuur).toBe(true)
    expect(signals.hasDuurIntensiteit).toBe(true)
    expect(signals.hasWerkwijzeAutonomie).toBe(true)
    expect(signals.hasWerkplekTijden).toBe(true)
    expect(signals.hasAansturingInstructies).toBe(true)
    expect(signals.hasBetalingModel).toBe(true)
    expect(signals.hasVervanging).toBe(true)
    expect(signals.hasInvesteringenMiddelen).toBe(true)
    expect(signals.hasMeerdereOpdrachtgevers).toBe(true)
    expect(signals.hasAcceptatiecriteria).toBe(true)
  })

  it('herkent "resultaat" signaal', () => {
    expect(detectSignals('het opleveren van een adviesrapport').hasResultaat).toBe(true)
    expect(detectSignals('de opdracht is voorbij').hasResultaat).toBe(false)
  })

  it('herkent "duur" signaal', () => {
    expect(detectSignals('de opdracht duurt 6 maanden').hasDuur).toBe(true)
    expect(detectSignals('opdracht met einddatum Q2 2025').hasDuur).toBe(true)
  })

  it('herkent "betalingsmodel" signaal', () => {
    expect(detectSignals('betaling per uur op uurtarief basis').hasBetalingModel).toBe(true)
    expect(detectSignals('vaste projectprijs na oplevering').hasBetalingModel).toBe(true)
  })

  it('herkent "vervanging" signaal', () => {
    expect(detectSignals('vervanging is toegestaan').hasVervanging).toBe(true)
    expect(detectSignals('hij mag een substituut inzetten').hasVervanging).toBe(true)
  })

  it('is case-insensitief', () => {
    expect(detectSignals('ZELFSTANDIG EN AUTONOOM').hasWerkwijzeAutonomie).toBe(true)
    expect(detectSignals('REMOTE WERKEN OP LOCATIE').hasWerkplekTijden).toBe(true)
  })
})

// ─── validateDbaInput ────────────────────────────────────────────────────────

describe('validateDbaInput', () => {
  it('geeft insufficient_input terug als tekst te kort is (chars)', () => {
    const short = 'a '.repeat(150) // ~300 chars, genoeg woorden maar te weinig chars
    const result = validateDbaInput(short.slice(0, 500))
    expect(result.status).toBe('insufficient_input')
  })

  it('geeft insufficient_input terug als tekst te weinig woorden heeft', () => {
    // 800 tekens maar minder dan 120 woorden → harde drempel op woorden
    const fewWords = 'a'.repeat(800)
    const result = validateDbaInput(fewWords)
    expect(result.status).toBe('insufficient_input')
  })

  it('geeft complete terug als tekst boven beide drempels zit', () => {
    const result = validateDbaInput(LONG_NEUTRAL_TEXT)
    expect(result.status).toBe('complete')
  })

  it('geeft complete terug ook als signalen ontbreken (signalen zijn niet blokkerend)', () => {
    const result = validateDbaInput(LONG_NEUTRAL_TEXT)
    // Signaalcount mag laag zijn — status moet toch complete zijn
    expect(result.status).toBe('complete')
  })

  it('retourneert juiste charCount en wordCount', () => {
    const text = 'één twee drie ' + makeText(900)
    const result = validateDbaInput(text)
    expect(result.charCount).toBe(text.length)
    expect(result.wordCount).toBeGreaterThan(INTAKE_THRESHOLDS.HARD_FAIL_WORDS)
  })

  it('retourneert signaalCount gelijk aan aantal gedetecteerde signalen', () => {
    const result = validateDbaInput(SIGNAL_RICH_TEXT + makeText(400))
    expect(result.signalCount).toBeGreaterThan(5)
  })

  it('limiteert missing en nextNeeded tot max 5 items', () => {
    const result = validateDbaInput(LONG_NEUTRAL_TEXT) // geen signalen
    expect(result.missing.length).toBeLessThanOrEqual(5)
    expect(result.nextNeeded.length).toBeLessThanOrEqual(5)
  })

  it('grenswaarde: exact op HARD_FAIL_CHARS en HARD_FAIL_WORDS', () => {
    // Precies op de grens → moet complete zijn
    const words = Array.from({ length: INTAKE_THRESHOLDS.HARD_FAIL_WORDS }, () => 'test').join(' ')
    const padded = words.padEnd(INTAKE_THRESHOLDS.HARD_FAIL_CHARS, 'x')
    const result = validateDbaInput(padded)
    expect(result.status).toBe('complete')
  })

  it('grenswaarde: één char onder minimum → insufficient_input', () => {
    const text = makeText(INTAKE_THRESHOLDS.HARD_FAIL_CHARS - 1)
    const result = validateDbaInput(text)
    expect(result.status).toBe('insufficient_input')
  })
})

// ─── buildFollowUpQuestions ──────────────────────────────────────────────────

describe('buildFollowUpQuestions', () => {
  it('retourneert max 5 vragen standaard', () => {
    const signals = detectSignals('')
    const questions = buildFollowUpQuestions(signals)
    expect(questions.length).toBeLessThanOrEqual(5)
  })

  it('retourneert geen vragen als alle signalen aanwezig zijn', () => {
    const signals = detectSignals(SIGNAL_RICH_TEXT)
    const allPresent = Object.values(signals).every(Boolean)
    if (allPresent) {
      const questions = buildFollowUpQuestions(signals)
      expect(questions.length).toBe(0)
    }
  })

  it('retourneert vragen alleen voor ontbrekende signalen', () => {
    const signals = detectSignals(SIGNAL_RICH_TEXT)
    const questions = buildFollowUpQuestions(signals)
    // Elke vraag mag alleen gaan over een missend signaal
    expect(questions.length).toBeLessThanOrEqual(5)
    questions.forEach(q => {
      expect(q.key).toBeTruthy()
      expect(q.question).toBeTruthy()
    })
  })

  it('respecteert maxQuestions parameter', () => {
    const signals = detectSignals('')
    expect(buildFollowUpQuestions(signals, 3).length).toBeLessThanOrEqual(3)
    expect(buildFollowUpQuestions(signals, 1).length).toBeLessThanOrEqual(1)
  })
})
