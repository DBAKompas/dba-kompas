import fs from 'fs';
import path from 'path';

export interface CorpusMetadata {
  corpus_version: string;
  last_updated: string;
  sources: Array<{
    id: string;
    ecli?: string;
    title: string;
    type: string;
    url?: string;
    file: string;
  }>;
  maintainer_note: string;
}

export interface CorpusDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  ecli?: string;
}

export interface RetrievedContext {
  corpus_version: string;
  documents: CorpusDocument[];
  sources: string[];
}

const CORPUS_PATH = path.join(process.cwd(), 'legal_corpus/nl_wet_dba');

function loadCorpusMetadata(): CorpusMetadata | null {
  try {
    const metadataPath = path.join(CORPUS_PATH, 'corpus_metadata.json');
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading corpus metadata:', error);
  }
  return null;
}

function loadCorpusDocuments(metadata: CorpusMetadata): CorpusDocument[] {
  const documents: CorpusDocument[] = [];

  for (const source of metadata.sources) {
    try {
      const filePath = path.join(CORPUS_PATH, source.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        documents.push({
          id: source.id,
          title: source.title,
          content,
          type: source.type,
          ecli: source.ecli
        });
      }
    } catch (error) {
      console.error(`Error loading corpus document ${source.file}:`, error);
    }
  }

  return documents;
}

function calculateRelevanceScore(document: CorpusDocument, inputText: string): number {
  const inputLower = inputText.toLowerCase();
  let score = 0;

  const deliverooKeywords = [
    'gezag', 'instructie', 'zelfstandig', 'vervang', 'persoonlijk',
    'organisatie', 'ingebed', 'werktijd', 'beloning', 'ondernemer',
    'risico', 'resultaat', 'overeenkomst', 'contract', 'dienstbetrekking'
  ];

  for (const keyword of deliverooKeywords) {
    if (inputLower.includes(keyword)) {
      score += 2;
    }
  }

  if (document.id === 'hr_2023_deliveroo') {
    score += 10;
  }

  if (document.id === 'belastingdienst_handhaving') {
    score += 5;
  }

  return score;
}

export function retrieveRelevantContext(inputText: string, topK: number = 2): RetrievedContext {
  const metadata = loadCorpusMetadata();

  if (!metadata) {
    return {
      corpus_version: 'unknown',
      documents: [],
      sources: []
    };
  }

  const documents = loadCorpusDocuments(metadata);

  const scoredDocs = documents.map(doc => ({
    doc,
    score: calculateRelevanceScore(doc, inputText)
  }));

  scoredDocs.sort((a, b) => b.score - a.score);

  const topDocs = scoredDocs.slice(0, topK).map(item => item.doc);

  const sources = topDocs.map(doc => {
    if (doc.ecli) {
      return `${doc.title} (${doc.ecli})`;
    }
    return doc.title;
  });

  return {
    corpus_version: metadata.corpus_version,
    documents: topDocs,
    sources
  };
}

export function getDeliverooFramework(): string {
  return `
DELIVEROO-KADER (HR 24-03-2023, ECLI:NL:HR:2023:443):
Bij de beoordeling of sprake is van een arbeidsovereenkomst moeten alle omstandigheden in onderlinge samenhang worden gewogen. De volgende 10 gezichtspunten MOETEN worden beoordeeld:

1. AARD EN DUUR WERKZAAMHEDEN
   - Wat is de aard van de werkzaamheden?
   - Hoe lang duurt de opdracht?

2. WIJZE VAN BEPALEN WERKTIJDEN EN UITVOERING
   - Wie bepaalt wanneer en hoe het werk wordt uitgevoerd?
   - Is er vrijheid in planning en werkwijze?

3. INBEDDING IN ORGANISATIE
   - Is de opdrachtnemer onderdeel van het team?
   - Werkt deze met interne systemen/collega's?

4. PERSOONLIJKE ARBEID / VERVANGBAARHEID
   - Moet het werk persoonlijk worden verricht?
   - Is vervanging toegestaan?

5. TOTSTANDKOMING OVEREENKOMST
   - Is onderhandeld over voorwaarden?
   - Standaardcontract of maatwerk?

6. BELONING EN BETALING
   - Factuur of salaris?
   - Periodiek of per resultaat?

7. ONDERNEMERSCHAP / ECONOMISCHE ZELFSTANDIGHEID
   - Meerdere opdrachtgevers?
   - Eigen acquisitie/marketing?
   - Investeringen in eigen bedrijf?

8. GEZAGSVERHOUDING
   - Instructiebevoegdheid opdrachtgever?
   - Toezicht op werkzaamheden?
   - Hiërarchische relatie?

9. ONDERNEMERSRISICO
   - Draagt opdrachtnemer financieel risico?
   - Resultaat- of inspanningsverplichting?

10. OVERIGE OMSTANDIGHEDEN
    - Alle andere relevante feiten
    - Branche-specifieke context

BELANGRIJK: Geen enkel gezichtspunt is op zichzelf doorslaggevend. De feitelijke uitvoering weegt zwaarder dan de contracttekst.
`;
}

export function formatContextForPrompt(context: RetrievedContext): string {
  if (context.documents.length === 0) {
    return getDeliverooFramework();
  }

  let result = `JURIDISCHE CONTEXT (corpus versie: ${context.corpus_version}):\n\n`;
  result += getDeliverooFramework();
  result += '\n\nBRONNEN:\n';
  result += context.sources.map(s => `- ${s}`).join('\n');

  return result;
}
