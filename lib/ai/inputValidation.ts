export const INTAKE_THRESHOLDS = {
  HARD_FAIL_WORDS: 120,
  HARD_FAIL_CHARS: 800,
  SOFT_FAIL_WORDS: 250,
  MIN_SIGNALS: 5,
} as const;

export const CLIENT_MIN_CHARS = 800;
export const CLIENT_MIN_WORDS = 120;

export type AnalysisStatus = 'complete' | 'needs_more_input' | 'insufficient_input';

export interface InputSignals {
  hasResultaat: boolean;
  hasDuur: boolean;
  hasDuurIntensiteit: boolean;
  hasWerkwijzeAutonomie: boolean;
  hasWerkplekTijden: boolean;
  hasAansturingInstructies: boolean;
  hasBetalingModel: boolean;
  hasVervanging: boolean;
  hasInvesteringenMiddelen: boolean;
  hasMeerdereOpdrachtgevers: boolean;
  hasAcceptatiecriteria: boolean;
}

export interface InputValidationResult {
  status: AnalysisStatus;
  charCount: number;
  wordCount: number;
  signalCount: number;
  signals: InputSignals;
  missing: string[];
  nextNeeded: string[];
}

export interface QuestionItem {
  key: string;
  label: string;
  question: string;
  hint: string;
  group: 'resultaat' | 'zelfstandigheid' | 'ondernemerschap' | 'context' | 'duur';
}

const SIGNAL_PATTERNS: Record<keyof InputSignals, { patterns: RegExp[]; label: string; example: string }> = {
  hasDuurIntensiteit: {
    patterns: [
      /\b(\d+\s*maanden?\s*(aaneengesloten|bij\s+(de\s+)?opdrachtgever|exclusief|ononderbroken|inmiddels|al|lang))\b/i,
      /\b(al\s+(meer\s+dan\s+)?\d+\s*maanden?\s*(bij|actief|werkzaam))\b/i,
      /\b(al\s+(meer\s+dan\s+)?\d+\s*jaar\s*(bij|actief|werkzaam))\b/i,
      /\b(aaneengesloten|ononderbroken|zonder\s+onderbreking|doorlopend)\b/i,
      /\b(\d+\s*(uur|uren)\s*(per|\/)\s*week\s*(gemiddeld|gemiddelde)?)\b/i,
      /\b(gemiddeld\s+\d+\s*(uur|uren)\s*(per|\/)\s*week)\b/i,
    ],
    label: "aaneengesloten inzetduur en gemiddelde inzetintensiteit",
    example: "Geef aan hoeveel maanden de opdracht al loopt en hoeveel uur per week gemiddeld",
  },
  hasResultaat: {
    patterns: [
      /\b(opleveren|deliverable|resultaat|eindresultaat|product|output|milestone|opbrengst)\b/i,
      /\b(bouwen|ontwikkelen|implementeren|realiseren|creëren|ontwerpen|analyseren|adviseren|begeleiden|uitvoeren)\b/i,
      /\b(rapport|systeem|applicatie|platform|advies|plan|strategie|documentatie|prototype)\b/i,
    ],
    label: "deliverables of resultaatverplichting",
    example: "Beschrijf welke concrete resultaten worden opgeleverd",
  },
  hasDuur: {
    patterns: [
      /\b(\d+\s*(maanden?|weken?|dagen?|jaar))\b/i,
      /\b(tot|t\/m|einddatum|deadline|looptijd|projectduur|tijdelijk|tijdelijke)\b/i,
      /\b(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+\d{4}/i,
      /\b(Q[1-4]|kwartaal)\s*\d{4}/i,
      /\b(kort|langdurig|korte\s+termijn|lange\s+termijn|periode)\b/i,
    ],
    label: "duur of einddatum",
    example: "Geef de projectduur aan",
  },
  hasWerkwijzeAutonomie: {
    patterns: [
      /\b(zelfstandig|autonoom|onafhankelijk|eigen\s*werkwijze|eigen\s*verantwoordelijkheid)\b/i,
      /\b(vrij\s+in|vrijheid|eigen\s+planning|eigen\s+methode|naar\s+eigen\s+inzicht)\b/i,
      /\b(resultaatverantwoordelijk|verantwoordelijk\s+voor\s+het\s+resultaat)\b/i,
    ],
    label: "werkwijze en autonomie",
    example: "Omschrijf de mate van zelfstandigheid",
  },
  hasWerkplekTijden: {
    patterns: [
      /\b(remote|thuiswerk|op\s+locatie|kantoor|hybride|werkplek|locatie)\b/i,
      /\b(werktijden|werkuren|beschikbaar|bereikbaar|flexibel|vaste\s+dagen|vaste\s+tijden)\b/i,
      /\b(\d+\s*(uur|uren)\s*(per|\/)\s*(week|dag|maand))\b/i,
      /\b(fulltime|parttime|part-time|full-time|inzet)\b/i,
    ],
    label: "werkplek en werktijden",
    example: "Vermeld de werklocatie en beschikbaarheid",
  },
  hasAansturingInstructies: {
    patterns: [
      /\b(rapporteert\s+aan|aanspreekpunt|opdrachtgever|contactpersoon|verantwoording)\b/i,
      /\b(aansturing|instructies|toezicht|leiding|gezag|manager|leidinggevende)\b/i,
      /\b(overleg|afstemming|communicatie\s+met|afstemt\s+met)\b/i,
      /\b(hiërarchisch|direct\s+aangestuurd)\b/i,
    ],
    label: "aansturing en rapportagelijn",
    example: "Vermeld hoe de aansturing plaatsvindt",
  },
  hasBetalingModel: {
    patterns: [
      /\b(per\s+(uur|dag|week|maand)|uurtarief|dagtarief|uurbasis)\b/i,
      /\b(per\s+(project|resultaat|milestone|deliverable|oplevering))\b/i,
      /\b(vaste\s+prijs|fixed\s+price|projectprijs|totaalprijs)\b/i,
      /\b(tarief|vergoeding|honorarium|factuur|betaling|faktureren)\b/i,
    ],
    label: "betalingsmodel",
    example: "Vermeld hoe wordt betaald",
  },
  hasVervanging: {
    patterns: [
      /\b(vervanging|vervangen|substituut|onderaannemer|derde|externe)\b/i,
      /\b(plaatsvervanger|vervangbaar|overdracht|handover)\b/i,
    ],
    label: "vervangbaarheid",
    example: "Vermeld of de opdrachtnemer zich kan laten vervangen",
  },
  hasInvesteringenMiddelen: {
    patterns: [
      /\b(eigen\s*(laptop|materiaal|gereedschap|software|tools|middelen))\b/i,
      /\b(eigen\s+investering|investeert|aanschaft|huurt)\b/i,
      /\b(eigen\s+risico|financieel\s+risico|aansprakelijkheid)\b/i,
    ],
    label: "eigen middelen en investeringen",
    example: "Vermeld welke eigen middelen of investeringen de opdrachtnemer inbrengt",
  },
  hasMeerdereOpdrachtgevers: {
    patterns: [
      /\b(meerdere\s+opdrachtgevers|andere\s+klanten|meerdere\s+klanten|vrije\s+tijd)\b/i,
      /\b(acquisitie|werving|eigen\s+klanten|eigen\s+netwerk|ondernemerschap)\b/i,
      /\b(ZZP|zelfstandige|ondernemer|eigen\s+onderneming|eigen\s+bedrijf)\b/i,
    ],
    label: "meerdere opdrachtgevers en ondernemerschap",
    example: "Vermeld of de opdrachtnemer ook voor andere opdrachtgevers werkt",
  },
  hasAcceptatiecriteria: {
    patterns: [
      /\b(acceptatiecriteria|acceptatie|goedkeuring|kwaliteitseisen|kwaliteitscriteria)\b/i,
      /\b(afbakening|scope|buiten\s+scope|in\s+scope|afhankelijkheden)\b/i,
      /\b(meetbaar|toetsbaar|aantoonbaar|criteria|kpi|kpis)\b/i,
    ],
    label: "acceptatiecriteria en afbakening",
    example: "Beschrijf de acceptatiecriteria of hoe het resultaat wordt beoordeeld",
  },
};

const QUESTION_BANK: Record<keyof InputSignals, QuestionItem> = {
  hasDuurIntensiteit: {
    key: 'hasDuurIntensiteit',
    label: 'Inzetduur en intensiteit',
    question: 'Hoeveel maanden is de opdrachtnemer al aaneengesloten actief bij deze opdrachtgever (zonder onderbreking van 6 maanden of langer)? En hoeveel uur per week gemiddeld?',
    hint: 'Bijv. "18 maanden aaneengesloten, gemiddeld 24 uur per week". Dit is relevant voor het beoordelen van het risico op duurzame inbedding.',
    group: 'duur',
  },
  hasResultaat: {
    key: 'hasResultaat',
    label: 'Resultaat en oplevering',
    question: 'Wat is het concrete resultaat of de oplevering van deze opdracht?',
    hint: 'Bijv. een werkend systeem, een adviesrapport, een geïmplementeerd proces, of een getraind team.',
    group: 'resultaat',
  },
  hasDuur: {
    key: 'hasDuur',
    label: 'Looptijd en tijdelijkheid',
    question: 'Hoe lang duurt de opdracht, en is het een tijdelijk project of een structurele rol?',
    hint: 'Bijv. "6 maanden", "t/m Q3 2025" of "tijdelijk ter vervanging van vast medewerker".',
    group: 'context',
  },
  hasWerkwijzeAutonomie: {
    key: 'hasWerkwijzeAutonomie',
    label: 'Autonomie en werkwijze',
    question: 'Wie bepaalt de werkwijze, werktijden en aanpak — de opdrachtnemer zelf of de opdrachtgever?',
    hint: 'Bijv. "werkt zelfstandig" of "werkwijze wordt bepaald door het team van de opdrachtgever".',
    group: 'zelfstandigheid',
  },
  hasWerkplekTijden: {
    key: 'hasWerkplekTijden',
    label: 'Werklocatie en beschikbaarheid',
    question: 'Waar werkt de opdrachtnemer en hoeveel uur of dagen per week?',
    hint: 'Bijv. "remote, flexibel" of "op locatie bij de klant, 3 dagen per week".',
    group: 'context',
  },
  hasAansturingInstructies: {
    key: 'hasAansturingInstructies',
    label: 'Aansturing en rapportage',
    question: 'Aan wie rapporteert de opdrachtnemer, en wie geeft inhoudelijke instructies?',
    hint: 'Bijv. "rapporteert op resultaat aan de projectdirecteur" of "wordt aangestuurd door de teammanager".',
    group: 'zelfstandigheid',
  },
  hasBetalingModel: {
    key: 'hasBetalingModel',
    label: 'Betaling',
    question: 'Wordt er betaald per uur, per dag, of per opgeleverd resultaat/project?',
    hint: 'Bijv. "vaste projectprijs", "per milestone" of "uurtarief".',
    group: 'resultaat',
  },
  hasVervanging: {
    key: 'hasVervanging',
    label: 'Vervangbaarheid',
    question: 'Mag de opdrachtnemer zich laten vervangen of taken uitbesteden aan een derde?',
    hint: 'Bijv. "vervanging is toegestaan mits de vervanger gekwalificeerd is".',
    group: 'zelfstandigheid',
  },
  hasInvesteringenMiddelen: {
    key: 'hasInvesteringenMiddelen',
    label: 'Eigen middelen en risico',
    question: 'Brengt de opdrachtnemer eigen middelen, tools of investeringen mee? En is er een eigen financieel risico?',
    hint: 'Bijv. "gebruikt eigen laptop en software" of "aansprakelijk voor fouten in eigen rapportage".',
    group: 'ondernemerschap',
  },
  hasMeerdereOpdrachtgevers: {
    key: 'hasMeerdereOpdrachtgevers',
    label: 'Ondernemerschap',
    question: 'Werkt de opdrachtnemer ook voor andere opdrachtgevers, of is dit de enige klant?',
    hint: 'Bijv. "heeft meerdere klanten" of "is exclusief beschikbaar voor deze opdrachtgever".',
    group: 'ondernemerschap',
  },
  hasAcceptatiecriteria: {
    key: 'hasAcceptatiecriteria',
    label: 'Acceptatie en afbakening',
    question: 'Hoe wordt bepaald of het resultaat goed genoeg is? Zijn er duidelijke acceptatiecriteria of een scope?',
    hint: 'Bijv. "akkoord van de projectstuurgroep", "voldoet aan kwaliteitscriteria X/Y".',
    group: 'resultaat',
  },
};

export function detectSignals(text: string): InputSignals {
  const signals: InputSignals = {
    hasResultaat: false,
    hasDuur: false,
    hasDuurIntensiteit: false,
    hasWerkwijzeAutonomie: false,
    hasWerkplekTijden: false,
    hasAansturingInstructies: false,
    hasBetalingModel: false,
    hasVervanging: false,
    hasInvesteringenMiddelen: false,
    hasMeerdereOpdrachtgevers: false,
    hasAcceptatiecriteria: false,
  };

  for (const [key, config] of Object.entries(SIGNAL_PATTERNS)) {
    const k = key as keyof InputSignals;
    signals[k] = config.patterns.some(p => p.test(text));
  }

  return signals;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function buildFollowUpQuestions(signals: InputSignals, maxQuestions = 5): QuestionItem[] {
  const PRIORITY_ORDER: (keyof InputSignals)[] = [
    'hasResultaat',
    'hasWerkwijzeAutonomie',
    'hasAansturingInstructies',
    'hasDuur',
    'hasDuurIntensiteit',
    'hasBetalingModel',
    'hasVervanging',
    'hasWerkplekTijden',
    'hasMeerdereOpdrachtgevers',
    'hasInvesteringenMiddelen',
    'hasAcceptatiecriteria',
  ];

  const missing = PRIORITY_ORDER.filter(key => !signals[key]);
  return missing.slice(0, maxQuestions).map(key => QUESTION_BANK[key]);
}

export function validateDbaInput(text: string): InputValidationResult {
  const charCount = text.length;
  const wordCount = countWords(text);
  const signals = detectSignals(text);
  const signalCount = Object.values(signals).filter(Boolean).length;

  const missing: string[] = [];
  const nextNeeded: string[] = [];

  for (const [key, config] of Object.entries(SIGNAL_PATTERNS)) {
    const k = key as keyof InputSignals;
    if (!signals[k]) {
      missing.push(config.label);
      nextNeeded.push(config.example);
    }
  }

  let status: AnalysisStatus;

  // Alleen harde minimumdrempel blokkeert de analyse.
  // Ontbrekende signalen worden als follow-up vragen getoond nádat de analyse klaar is.
  if (charCount < INTAKE_THRESHOLDS.HARD_FAIL_CHARS || wordCount < INTAKE_THRESHOLDS.HARD_FAIL_WORDS) {
    status = 'insufficient_input';
  } else {
    status = 'complete';
  }

  return {
    status,
    charCount,
    wordCount,
    signalCount,
    signals,
    missing: missing.slice(0, 5),
    nextNeeded: nextNeeded.slice(0, 5),
  };
}

export interface InsufficientInputResponse {
  status: 'insufficient_input';
  summary: string;
  missing: string[];
  next_needed: string[];
  followUpQuestions: QuestionItem[];
  disclaimer: string;
  validation: {
    charCount: number;
    wordCount: number;
    signalCount: number;
    minCharRequired: number;
    minWordRequired: number;
    minSignalsRequired: number;
  };
}

export interface NeedsMoreInputResponse {
  status: 'needs_more_input';
  summary: string;
  missing: string[];
  next_needed: string[];
  followUpQuestions: QuestionItem[];
  disclaimer: string;
  validation: {
    charCount: number;
    wordCount: number;
    signalCount: number;
    minCharRequired: number;
    minWordRequired: number;
    minSignalsRequired: number;
  };
}

export function createInsufficientInputResponse(validation: InputValidationResult): InsufficientInputResponse {
  const issues: string[] = [];
  if (validation.charCount < INTAKE_THRESHOLDS.HARD_FAIL_CHARS) {
    issues.push(`minimaal ${INTAKE_THRESHOLDS.HARD_FAIL_CHARS} tekens nodig (nu: ${validation.charCount})`);
  }
  if (validation.wordCount < INTAKE_THRESHOLDS.HARD_FAIL_WORDS) {
    issues.push(`minimaal ${INTAKE_THRESHOLDS.HARD_FAIL_WORDS} woorden nodig (nu: ${validation.wordCount})`);
  }

  const questions = buildFollowUpQuestions(validation.signals, 5);

  return {
    status: 'insufficient_input',
    summary: `Voor een volledige risico-inschatting ontbreekt nog informatie: ${issues.join('; ')}.`,
    missing: validation.missing,
    next_needed: questions.map(q => q.question),
    followUpQuestions: questions,
    disclaimer: "Indicatieve analyse — geen juridisch advies.",
    validation: {
      charCount: validation.charCount,
      wordCount: validation.wordCount,
      signalCount: validation.signalCount,
      minCharRequired: INTAKE_THRESHOLDS.HARD_FAIL_CHARS,
      minWordRequired: INTAKE_THRESHOLDS.HARD_FAIL_WORDS,
      minSignalsRequired: INTAKE_THRESHOLDS.MIN_SIGNALS,
    },
  };
}

export function createNeedsMoreInputResponse(validation: InputValidationResult): NeedsMoreInputResponse {
  const questions = buildFollowUpQuestions(validation.signals, 5);

  return {
    status: 'needs_more_input',
    summary: `De richting is deels te beoordelen, maar voor een volledige analyse missen nog enkele feiten (${validation.wordCount} woorden, ${validation.signalCount} van ${INTAKE_THRESHOLDS.MIN_SIGNALS} kernsignalen gedetecteerd).`,
    missing: validation.missing,
    next_needed: questions.map(q => q.question),
    followUpQuestions: questions,
    disclaimer: "Indicatieve analyse — geen juridisch advies.",
    validation: {
      charCount: validation.charCount,
      wordCount: validation.wordCount,
      signalCount: validation.signalCount,
      minCharRequired: INTAKE_THRESHOLDS.HARD_FAIL_CHARS,
      minWordRequired: INTAKE_THRESHOLDS.HARD_FAIL_WORDS,
      minSignalsRequired: INTAKE_THRESHOLDS.MIN_SIGNALS,
    },
  };
}
