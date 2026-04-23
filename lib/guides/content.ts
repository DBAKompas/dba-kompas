// ─────────────────────────────────────────────────────────────
// Gidsen - type-systeem en content
// ─────────────────────────────────────────────────────────────

export type GuideBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level?: 2 | 3 }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'callout'; variant: 'tip' | 'warning' | 'example' | 'important'; title?: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'divider' }

export type GuideDifficulty = 'basis' | 'gevorderd' | 'expert'

export interface GuideEntry {
  slug: string
  title: string
  subtitle: string
  description: string
  category: string
  readingTime: number      // in minuten
  difficulty: GuideDifficulty
  tags: string[]
  blocks: GuideBlock[]
}

// ─────────────────────────────────────────────────────────────
// Hulpfuncties voor leesbaarheid
// ─────────────────────────────────────────────────────────────

const p = (text: string): GuideBlock => ({ type: 'paragraph', text })
const h2 = (text: string): GuideBlock => ({ type: 'heading', text, level: 2 })
const h3 = (text: string): GuideBlock => ({ type: 'heading', text, level: 3 })
const ul = (items: string[]): GuideBlock => ({ type: 'list', items })
const ol = (items: string[]): GuideBlock => ({ type: 'list', items, ordered: true })
const tip = (text: string, title?: string): GuideBlock => ({ type: 'callout', variant: 'tip', text, title })
const warn = (text: string, title?: string): GuideBlock => ({ type: 'callout', variant: 'warning', text, title })
const ex = (text: string, title?: string): GuideBlock => ({ type: 'callout', variant: 'example', text, title })
const imp = (text: string, title?: string): GuideBlock => ({ type: 'callout', variant: 'important', text, title })
const divider = (): GuideBlock => ({ type: 'divider' })

// ─────────────────────────────────────────────────────────────
// GIDSEN
// ─────────────────────────────────────────────────────────────

export const GUIDES: GuideEntry[] = [

  // ── 1. Wet DBA volledig ──────────────────────────────────
  {
    slug: 'wet-dba-compleet',
    title: 'De Wet DBA: alles wat je moet weten',
    subtitle: 'Van wetgeving tot handhaving - compleet overzicht',
    description: 'Een grondige uitleg van de Wet Deregulering Beoordeling Arbeidsrelaties: de geschiedenis, de criteria, wat er veranderd is in 2025 en wat het betekent voor jou als zzp\'er.',
    category: 'DBA & Arbeidsrelaties',
    readingTime: 12,
    difficulty: 'basis',
    tags: ['wet dba', 'arbeidsrelatie', 'schijnzelfstandigheid', 'vab', 'handhaving'],
    blocks: [
      h2('Wat is de Wet DBA?'),
      p('De Wet Deregulering Beoordeling Arbeidsrelaties (Wet DBA) is op 1 mei 2016 ingevoerd als opvolger van de Verklaring Arbeidsrelatie (VAR). Het doel is om schijnzelfstandigheid aan te pakken: situaties waarbij iemand formeel als zzp\'er werkt maar feitelijk een werknemer is.'),
      p('Onder de VAR was de verantwoordelijkheid voor de kwalificatie van de arbeidsrelatie vrijwel volledig bij de opdrachtnemer gelegd. De VAR gaf opdrachtgevers een schijnzekerheid die niet aansloot bij de werkelijkheid. De Wet DBA maakt zowel de opdrachtgever als de opdrachtnemer medeverantwoordelijk.'),

      imp('Sinds 1 januari 2025 is het handhavingsmoratorium volledig opgeheven. De Belastingdienst handhaaft actief op schijnzelfstandigheid. Zowel opdrachtgevers als zzp\'ers lopen risico op naheffingen en boetes.', 'Handhaving is nu actief'),

      h2('De drie kerncriteria'),
      p('De Belastingdienst beoordeelt of er sprake is van een dienstbetrekking aan de hand van drie elementen. Zijn alle drie aanwezig, dan is er sprake van een arbeidsovereenkomst - ook als partijen dat niet zo hebben bedoeld.'),

      {
        type: 'table',
        headers: ['Criterium', 'Betekenis', 'Risicosignalen'],
        rows: [
          ['Persoonlijke arbeid', 'De opdrachtnemer verricht het werk zelf, zonder vrije vervangingsmogelijkheid.', 'Geen vervangingsclausule, opdrachtgever bepaalt wie het werk doet.'],
          ['Loon', 'Er is een (min of meer) vaste vergoeding, los van het resultaat.', 'Uurtarief zonder resultaatsverplichting, vaste maandelijkse betaling.'],
          ['Gezagsverhouding', 'De opdrachtgever heeft instructiebevoegdheid over hoe het werk wordt gedaan.', 'Verplichte werktijden, directe aansturing, functioneringsgesprekken.'],
        ],
      },

      warn('Het gaat altijd om de feitelijke situatie, niet alleen om wat er op papier staat. Een mooie opdrachtovereenkomst is waardeloos als de dagelijkse praktijk anders is.', 'Papier vs. werkelijkheid'),

      h2('Wat veranderde er in 2025?'),
      p('Tot en met 31 december 2024 gold een handhavingsmoratorium: de Belastingdienst controleerde wel, maar legde in de meeste gevallen geen correcties op. Dat is voorbij. Per 1 januari 2025 handhaaft de Belastingdienst volledig, ook met terugwerkende kracht tot vijf jaar.'),
      p('De Wet VBAR (Verduidelijking Beoordeling Arbeidsrelaties en Rechtsvermoeden), die het criterium "werken in dienst van" nader definieert, treedt naar verwachting ook in 2025 in werking. Daarin wordt een rechtsvermoeden van een arbeidsovereenkomst ingevoerd bij een uurtarief onder een bepaalde drempel.'),

      tip('Controleer je huidige en recente opdrachten op de DBA-criteria. Als je twijfelt: gebruik DBA Kompas om je opdrachtomschrijvingen te analyseren voordat je ze indient of verlengt.', 'Wat kun je nu doen?'),

      h2('Wat zijn de gevolgen bij een overtreding?'),
      ul([
        'Naheffing loonbelasting en premies volksverzekeringen - met terugwerkende kracht tot vijf jaar.',
        'Boete tot 100% van de naheffing bij opzet of grove schuld.',
        'Verlies van zelfstandigenaftrek en MKB-winstvrijstelling.',
        'Pensioenschade: werkgever kan worden verplicht het werknemerspensioen alsnog op te bouwen.',
        'Reputatieschade voor de opdrachtgever.',
      ]),

      h2('Modelovereenkomsten'),
      p('De Belastingdienst heeft een aantal modelovereenkomsten goedgekeurd die kunnen worden gebruikt als basis voor de contractuele relatie. Het gebruik van een goedgekeurde modelovereenkomst biedt zekerheid - maar alleen als de feitelijke werkwijze ook daadwerkelijk aansluit bij het model.'),

      tip('Een modelovereenkomst is een hulpmiddel, geen vrijbrief. Controleer altijd of de dagelijkse praktijk overeenstemt met de tekst van het contract.'),

      h2('Het verschil met loondienst - samengevat'),
      {
        type: 'table',
        headers: ['Kenmerk', 'Zzp\'er / opdrachtnemer', 'Werknemer'],
        rows: [
          ['Instructie over aanpak', 'Bepaalt zelf hoe het werk wordt gedaan', 'Volgt instructies van werkgever'],
          ['Vervanging', 'Kan zich vrij laten vervangen', 'Persoonlijke arbeidsplicht'],
          ['Risico', 'Draagt eigen financieel risico', 'Werkgever draagt risico'],
          ['Gereedschap', 'Gebruikt eigen middelen', 'Werkt met middelen van werkgever'],
          ['Meerdere opdrachtgevers', 'Werkt voor meerdere klanten', 'Exclusiviteit bij één werkgever'],
        ],
      },

      ex('Een IT-consultant die wordt ingehuurd voor een specifiek project (migratie van een systeem, oplevering van een module) en zelf bepaalt hoe hij dat aanpakt, werkt doorgaans als zzp\'er. Een "consultant" die dagelijks aanwezig moet zijn, werktijden krijgt opgelegd en in een team zit met vaste collega\'s, is vrijwel zeker een werknemer in de ogen van de Belastingdienst.', 'Praktijkvoorbeeld'),
    ],
  },

  // ── 2. Gezagsverhouding ──────────────────────────────────
  {
    slug: 'gezagsverhouding',
    title: 'Gezagsverhouding herkennen',
    subtitle: '12 concrete signalen - en hoe je ze neutraliseert',
    description: 'De gezagsverhouding is het meest bepalende criterium bij DBA-controles. Leer welke signalen een rol spelen, waarom ze risicovol zijn en hoe je ze aanpakt.',
    category: 'DBA & Arbeidsrelaties',
    readingTime: 9,
    difficulty: 'gevorderd',
    tags: ['gezag', 'instructiebevoegdheid', 'arbeidsrelatie', 'dienstbetrekking'],
    blocks: [
      h2('Wat is een gezagsverhouding?'),
      p('Een gezagsverhouding betekent dat de opdrachtgever bepaalt hoe het werk wordt uitgevoerd - niet alleen wát er wordt opgeleverd. Zodra iemand instructies kan geven over de werkwijze, werktijden, aanpak of gedrag, is er sprake van een mate van gezag. Dit is één van de drie vereisten voor een arbeidsovereenkomst.'),
      p('Rechters en de Belastingdienst kijken hierbij naar het totaalplaatje. Eén enkel signaal is zelden doorslaggevend, maar meerdere signalen samen kunnen de relatie juridisch kleuren als een dienstbetrekking.'),

      imp('Bij DBA-controles is de gezagsverhouding het vaakst onderzochte criterium. Het telt zwaar mee, ook als de andere criteria (loon en persoonlijke arbeid) minder sterk aanwezig zijn.'),

      h2('De 12 voornaamste signalen'),

      h3('1. Opdrachtgever bepaalt werktijden'),
      p('Als je verplicht bent om op vaste tijden aanwezig te zijn - op locatie, in een vergadering, of online - dan heeft de opdrachtgever invloed op wanneer je werkt. Dat is een gezagssignaal.'),
      tip('Zorg voor een resultaatsverplichting met eigen planning. "Oplevering uiterlijk vrijdag" is beter dan "aanwezig maandag t/m vrijdag van 9 tot 17 uur".'),

      h3('2. Directe instructies over de werkwijze'),
      p('Als een leidinggevende, manager of teamlead aangeeft hoe je taken moet uitvoeren - welke tools je gebruikt, hoe je communiceert, welke methode je volgt - is er sprake van inhoudelijke aansturing.'),
      warn('Dit speelt sterk in IT-omgevingen waar agile-teams werken. Als de Scrum Master of Product Owner je werk stuurt en prioriteert, is er een gezagsrisico.'),

      h3('3. Integratie in de organisatie'),
      p('Als je volledig onderdeel bent van een team - vaste werkplek, bedrijfsadres op je visitekaartje, deelname aan interne overleggen, toegang tot intern systemen als medewerker - dan is de grens met een dienstbetrekking dun.'),

      h3('4. Exclusiviteit of urenplafond'),
      p('Een verbod op het werken voor andere opdrachtgevers of een verplichting om een minimaal aantal uren te werken versterkt het beeld van een arbeidsrelatie.'),

      h3('5. Verplichte aanwezigheid bij vergaderingen'),
      p('Af en toe afstemmen is normaal. Maar als je structureel verplicht wordt deel te nemen aan interne teamoverleggen, standups of wekelijkse rituals als ware je een medewerker, is er een risico.'),

      h3('6. Gedragsregels en huisregels'),
      p('Als de opdrachtgever gedragsregels, kledingvoorschriften of huisregels oplegt die normaal gesproken gelden voor werknemers, wijst dat op een gezagsverhouding.'),

      h3('7. Functionerings- of beoordelingsgesprekken'),
      p('Dit is een sterk signaal. Beoordeling van functioneren is typisch iets van een werkgever/werknemer-relatie, niet van een opdrachtgever/opdrachtnemer-relatie.'),

      imp('Als je opdrachtgever je uitnodigt voor een "evaluatiegesprek" of "functioneringsgesprek", vraag dan of dit kan worden omschreven als projectevaluatie - en leg dat vast.'),

      h3('8. Toestemming nodig voor verlof of afwezigheid'),
      p('Een zelfstandige hoeft geen verlof aan te vragen. Als je wel toestemming nodig hebt voor afwezigheid, is dat een duidelijk werkgeversrecht dat wordt uitgeoefend.'),

      h3('9. Gebruik van werkgeversmateriaal als primaire werkmiddelen'),
      p('Werken met je eigen laptop, software en tools is een indicator van zelfstandigheid. Als de opdrachtgever al je werkmateriaal levert en je niets van jezelf inbrengt, is dat een punt van aandacht.'),

      h3('10. Vaste vergoeding zonder resultaatsverplichting'),
      p('Een uurtarief alleen is op zichzelf niet problematisch, maar gecombineerd met de afwezigheid van een resultaatsafspraak (wat lever je op?) vergroot het de kans op kwalificatie als loon.'),

      h3('11. Deelname aan personeelsuitjes of bedrijfsevenementen'),
      p('Sporadisch is dit geen probleem. Maar structurele deelname aan interne personeelszaken versterkt het beeld van integratie in de organisatie.'),

      h3('12. Medewerker-gerelateerde doorlooptijden'),
      p('Als je opdrachten steeds worden verlengd zonder herdefiniëring van de resultaten, ontstaat er feitelijk een vaste aanstelling zonder arbeidscontract. Dit is risicovol.'),

      divider(),

      h2('Hoe neutraliseer je gezagssignalen?'),
      ul([
        'Werk op basis van duidelijke resultaatsverplichtingen: beschrijf wat je oplevert, niet wanneer je aanwezig bent.',
        'Leg vast dat je vrij bent in de keuze van werktijden en -methoden.',
        'Zorg voor een vervangingsclausule in je contract.',
        'Werk met meerdere opdrachtgevers tegelijk, ook al is het maar voor een klein deel van je omzet.',
        'Vermijd deelname aan interne HR-processen (beoordelingen, verlofsysteem, ziekteverzuimregistratie).',
        'Gebruik je eigen laptop, tools en licenties.',
        'Begrens de looptijd van opdrachten en herdefinieer bij elke verlenging de doelstellingen.',
      ]),

      ex('Stel je werkt als IT-architect bij een gemeente. In plaats van "aanwezig op kantoor en deelname aan dagelijkse standup" schrijf je in je opdrachtomschrijving: "Levering van een goedgekeurd architectuurplan voor het datamigratieproject inclusief twee reviewrondes, uiterlijk 1 september." Je plant zelf je werkdagen en neemt alleen deel aan het wekelijkse architectuuroverleg als die relevant is voor je deliverable.', 'Zo doe je het'),
    ],
  },

  // ── 3. Zelfstandigheid aantonen ─────────────────────────
  {
    slug: 'zelfstandigheid-aantonen',
    title: 'Zelfstandigheid aantonen',
    subtitle: 'Het praktijkprotocol voor zzp\'ers die hun positie willen beschermen',
    description: 'Zelfstandigheid is meer dan een KvK-inschrijving. Leer hoe je met concrete stappen aantoont dat je echt ondernemer bent - op papier en in de praktijk.',
    category: 'DBA & Arbeidsrelaties',
    readingTime: 10,
    difficulty: 'gevorderd',
    tags: ['zelfstandigheid', 'ondernemer', 'bewijslast', 'multi-opdrachtgever', 'risico'],
    blocks: [
      h2('Waarom bewijs nodig is'),
      p('Zelfstandigheid is geen status die automatisch volgt uit een KvK-nummer of een factuur. De Belastingdienst en rechters kijken naar de feitelijke situatie: hoe ziet je werkrelatie eruit in de praktijk? Wie stuurt je aan, wie draagt het risico, voor wie werk je?'),
      p('Wanneer er een controle komt, wordt de bewijslast verdeeld. De Belastingdienst toont aan dat er sprake is van een dienstbetrekking. Jij toont aan dat je ondernemer bent. Wie het sterkste bewijs heeft, wint. Dit is waarom je je zelfstandigheid actief moet documenteren.'),

      imp('De Belastingdienst kijkt niet naar één opdracht, maar naar het patroon van jouw ondernemingsactiviteiten. Een solide dossier telt zwaarder dan een goed contract.'),

      h2('De vier pijlers van aantoonbare zelfstandigheid'),

      h3('Pijler 1: Meerdere opdrachtgevers'),
      p('Eén van de sterkste indicatoren van zelfstandigheid is dat je voor meerdere opdrachtgevers werkt. Dit toont aan dat je niet afhankelijk bent van één werkgever-achtige partij.'),
      ul([
        'Streef naar minimaal twee actieve opdrachtgevers tegelijk, of toon aan dat je dat in het verleden hebt gehad.',
        'Documenteer elke opdracht: naam opdrachtgever, looptijd, aard van het werk, factuurbedrag.',
        'Bewaar alle facturen en opdrachtovereenkomsten in een overzichtelijk archief.',
        'Vergeet kleine opdrachten niet: ook een kleine klus voor een tweede opdrachtgever telt mee.',
      ]),
      tip('Heb je tijdelijk maar één opdrachtgever? Zorg dan dat de andere indicatoren van zelfstandigheid sterker aanwezig zijn. Werk ondertussen actief aan het aantrekken van een tweede klant.'),

      h3('Pijler 2: Financieel risico'),
      p('Als ondernemer draag je risico dat een werknemer niet heeft. Denk aan het risico van onbetaalde facturen, aansprakelijkheid voor fouten, investeringen in je eigen opleiding en materiaal.'),
      ul([
        'Sluit een aansprakelijkheidsverzekering af en bewaar de polissen.',
        'Investeer in je eigen werkmateriaal: laptop, software, tools.',
        'Gebruik een zakelijke bankrekening en bewaar bankafschriften.',
        'Accepteer opdrachten op basis van een vaste prijs of resultaatsverplichting - niet enkel per uur zonder enig risico.',
      ]),
      ex('Je accepteert een opdracht voor €15.000 voor de oplevering van een werkend systeem. Als het meer uren kost dan begroot, draag jij dat risico. Dat is ondernemersrisico. Vergelijk dit met "100 uur à €90 per uur, met goedkeuring voor eventuele meeruren" - dat laatste heeft minder ondernemerskarakter.', 'Voorbeeld van financieel risico'),

      h3('Pijler 3: Eigen werkwijze en middelen'),
      p('Jij bepaalt hoe je je werk uitvoert. Jij gebruikt je eigen materialen. Jij beslist welke tools, methoden en processen je inzet.'),
      ul([
        'Werk altijd met je eigen laptop en licenties.',
        'Gebruik je eigen software-abonnementen (Office, design tools, IDE\'s).',
        'Maak je eigen planningen en kies je eigen werkplek - thuis, op kantoor of elders.',
        'Leg in het contract vast dat je vrij bent in de keuze van werkwijze.',
      ]),

      h3('Pijler 4: Ondernemersactiviteiten'),
      p('Een echte ondernemer investeert in zijn bedrijf. Dit is zichtbaar in hoe je opereert naast de opdrachten.'),
      ul([
        'Heb een eigen website met zakelijke content.',
        'Stuur actief acquisitie-e-mails of benader nieuwe klanten.',
        'Doe aan netwerken (LinkedIn, vakverenigingen, events).',
        'Investeer in opleiding en kennisonderhoud.',
        'Houd een actueel portfolio of klantenoverzicht bij.',
      ]),

      divider(),

      h2('Je zelfstandigheidsdossier opbouwen'),
      p('Stel een dossier samen dat je kunt tonen bij een controle. Denk aan:'),
      ol([
        'Alle opdrachtovereenkomsten van de afgelopen vijf jaar.',
        'Facturen en bankafschriften waaruit meerdere opdrachtgevers blijken.',
        'Polis aansprakelijkheidsverzekering.',
        'Bewijs van eigen werkmateriaal (aankoopbonnen, licenties).',
        'Documenten van ondernemersactiviteiten: offertes, acquisitie-e-mails, netwerkkontakten.',
        'Eventuele afwijzingen: ook opdrachten die je niet hebt aangenomen tonen ondernemersgedrag.',
      ]),

      warn('Bewaar alles minimaal 7 jaar. De Belastingdienst kan vijf jaar terug controleren en je hebt dan de bewijslast.'),

      h2('Wat als je (tijdelijk) afhankelijk bent van één opdrachtgever?'),
      p('Dit komt voor, zeker bij zzp\'ers die net starten of bij langdurige projecten. Compenseer dit dan actief op de andere pijlers: verhoog het financieel risico (vaste prijs), versterk de eigen werkwijze en zorg dat de opdrachtomschrijving zuiver is.'),
      tip('Overweeg ook een kleine nevenenopdracht: een kortdurende klus voor een tweede klant, ook al is die kleiner. Dit doorbreekt het afhankelijkheidssignaal.'),
    ],
  },

  // ── 4. Opdrachtomschrijving handleiding ─────────────────
  {
    slug: 'opdrachtomschrijving-handleiding',
    title: 'De perfecte opdrachtomschrijving',
    subtitle: 'Stap-voor-stap handleiding met voor/na-voorbeelden',
    description: 'Alles wat je moet weten over het schrijven van een opdrachtomschrijving die DBA-proof is: structuur, formuleringen, valkuilen en praktijkvoorbeelden per sector.',
    category: 'DBA & Arbeidsrelaties',
    readingTime: 14,
    difficulty: 'basis',
    tags: ['opdrachtomschrijving', 'contract', 'resultaat', 'formulering', 'it', 'publiek domein'],
    blocks: [
      h2('Waarom de opdrachtomschrijving zo belangrijk is'),
      p('De opdrachtomschrijving is het fundament van je DBA-positie. Het is het eerste document dat de Belastingdienst opvraagt bij een controle. Het is ook de basis waarop je opdrachtgever jou aanneemt. Een zwakke opdrachtomschrijving creëert twijfel - over wie je bent, wat je doet, en of je wel écht zelfstandig werkt.'),
      p('Een sterke opdrachtomschrijving doet vier dingen tegelijk: het beschrijft het resultaat (niet de aanwezigheid), het legt de zelfstandigheid vast, het definieert de grenzen van de opdracht en het maakt duidelijk dat jij de professional bent die de aanpak bepaalt.'),

      h2('De zes bouwstenen van een goede opdrachtomschrijving'),

      h3('1. Het te leveren resultaat'),
      p('Beschrijf wat je oplevert, niet wat je doet of hoeveel uur je aanwezig bent. Een resultaat is meetbaar, heeft een oplevermoment en is beoordeelbaar.'),
      {
        type: 'table',
        headers: ['Zwak (procesgericht)', 'Sterk (resultaatgericht)'],
        rows: [
          ['De opdrachtnemer ondersteunt het team bij werkzaamheden.', 'De opdrachtnemer levert een goedgekeurd architectuurplan op voor het migratieproject.'],
          ['De opdrachtnemer is beschikbaar voor 40 uur per week.', 'De opdrachtnemer levert de eerste testomgeving op uiterlijk 1 augustus.'],
          ['De opdrachtnemer helpt bij de implementatie.', 'De opdrachtnemer verzorgt de migratie van module X naar platform Y, inclusief documentatie en overdracht.'],
        ],
      },

      h3('2. De opdrachtgever/opdrachtnemer-verhouding'),
      p('Vermijd termen die thuishoren in een arbeidsrelatie. Gebruik consequent "opdrachtgever" en "opdrachtnemer" in plaats van "werkgever/werknemer" of "leidinggevende". Dit klinkt klein, maar rechters letten hierop.'),
      warn('Vermijd deze woorden in je opdrachtomschrijving: dienstverband, leidinggevende, manager, teamlid, medewerker, verlof, ziek melden, functioneringsgesprek, rooster.'),

      h3('3. Vrije vervanging'),
      p('De mogelijkheid om je te laten vervangen door een andere gekwalificeerde professional is een sterk signaal van zelfstandigheid. Neem een vervangingsclausule op.'),
      ex('"De opdrachtnemer is gerechtigd de werkzaamheden geheel of gedeeltelijk te laten uitvoeren door een andere persoon, mits deze beschikt over de vereiste vakkennis en de opdrachtnemer daarvoor verantwoordelijkheid draagt."'),

      h3('4. Eigen aanpak en werkwijze'),
      p('Leg vast dat jij bepaalt hoe je het resultaat behaalt. Dit sluit instructiebevoegdheid over de methode uit.'),
      ex('"De opdrachtnemer is vrij in de keuze van werkwijze, methodiek en planning, binnen de afgesproken kwaliteitscriteria en opleverdata."'),

      h3('5. Aansprakelijkheid'),
      p('Een bepaling over aansprakelijkheid versterkt het ondernemerskarakter. Jij staat in voor het resultaat.'),
      ex('"De opdrachtnemer staat in voor de kwaliteit van de opgeleverde werkzaamheden. Bij gebreken zal de opdrachtnemer deze binnen een redelijke termijn herstellen."'),

      h3('6. Looptijd en afloopdatum'),
      p('Definieer de opdracht in tijd. Oneindige opdrachten zonder herdefiniëring van doelstellingen lijken op een vaste aanstelling.'),
      tip('Herdefinieer bij elke verlenging de te leveren resultaten. Een verlenging is een nieuwe opdracht - behandel het ook zo.'),

      divider(),

      h2('Veelgemaakte fouten per sector'),

      h3('IT-zzp\'ers'),
      ul([
        '"Beschikbaar zijn voor het team" → Schrijf: "Opleveren van X feature/module/document"',
        '"Dagelijks standup bijwonen" → Schrijf: "Afstemming over voortgang naar eigen inzicht inplannen"',
        '"Werken in het kantoorsysteem met een bedrijfsaccount" → Let op: gebruik eigen tools en vermeld dit in het contract',
        '"Verlenging van de detacheringsovereenkomst" → Herschrijf als nieuwe opdrachtovereenkomst met nieuwe resultaten',
      ]),

      h3('Zzp\'ers in het publiek domein'),
      ul([
        '"Inhuur via raamcontract voor 36 uur per week" → Zorg voor een specifiek project met concrete deliverables',
        '"Ter beschikking stellen van capaciteit" → Schrijf: "Levering van [specifiek product/rapport/plan]"',
        '"Deelname aan werkoverleg als teamlid" → Schrijf: "Periodieke voortgangsafstemming met de opdrachtgever"',
        '"Functioneringsgesprek na zes maanden" → Vervang door: "Evaluatie van de opgeleverde resultaten"',
      ]),

      divider(),

      h2('Checklist voor je opdrachtomschrijving'),
      ol([
        'Staat er een concreet, meetbaar resultaat in?',
        'Is de looptijd afgebakend met een einddatum?',
        'Staat er een vervangingsclausule in?',
        'Is de vrijheid in werkwijze vastgelegd?',
        'Zijn arbeidsrechtelijke termen vermeden?',
        'Staat er een aansprakelijkheidsclausule in?',
        'Is het duidelijk dat jij zelfstandig ondernemer bent (geen cao, geen arbeidsrecht)?',
        'Heb je DBA Kompas de tekst laten analyseren?',
      ]),

      tip('Gebruik DBA Kompas om je opdrachtomschrijving te analyseren voordat je hem instuurt. De tool signaleert risico-formuleringen en geeft een herschreven versie die DBA-compliant is.'),
    ],
  },

  // ── 5. Handhaving Belastingdienst ───────────────────────
  {
    slug: 'handhaving-belastingdienst',
    title: 'Handhaving door de Belastingdienst',
    subtitle: 'Wat gebeurt er bij een controle en hoe bereid je je voor?',
    description: 'Alles over hoe de Belastingdienst controleert op schijnzelfstandigheid, welke gevolgen een controle kan hebben en hoe je je dossier op orde houdt.',
    category: 'DBA & Arbeidsrelaties',
    readingTime: 11,
    difficulty: 'gevorderd',
    tags: ['handhaving', 'belastingdienst', 'naheffing', 'boete', 'controle', 'risico'],
    blocks: [
      h2('Het einde van het moratorium'),
      p('Van 2016 tot en met 2024 gold een handhavingsmoratorium: de Belastingdienst kon wel controleren en aanwijzingen geven, maar legde in de meeste gevallen geen correcties op. Per 1 januari 2025 is dit moratorium volledig opgeheven.'),
      p('Dat betekent dat de Belastingdienst nu actief kan controleren, naheffingen kan opleggen en boetes kan uitschrijven - ook voor situaties die al vóór 2025 speelden, tot vijf jaar terug.'),

      imp('Als je opdrachtrelaties in de afgelopen jaren niet goed waren gedocumenteerd of als de feiten wezen op een dienstbetrekking, loop je nu reëel risico. Onderneem actie.'),

      h2('Hoe controleert de Belastingdienst?'),
      p('Een controle op schijnzelfstandigheid verloopt doorgaans via de opdrachtgever, niet via de zzp\'er zelf. De Belastingdienst vraagt dan aan de opdrachtgever om informatie over de inhuurconstructie. Maar ook een aangifte van een (voormalig) zzp\'er of concurrent kan een controle in gang zetten.'),

      h3('Wat wordt onderzocht?'),
      ul([
        'De opdrachtovereenkomst(en) en eventuele verlengingen.',
        'Facturen en betalingspatronen.',
        'E-mails, Teams-gesprekken of andere correspondentie over de werkwijze.',
        'Getuigenissen van collega-werknemers of andere zzp\'ers over de feitelijke situatie.',
        'Toegangspassen, roosters, aanwezigheidsregistraties.',
        'Gebruik van bedrijfsmiddelen (laptop, auto, software).',
      ]),

      warn('De Belastingdienst kijkt naar de feitelijke situatie. Contracten die op papier goed zijn maar in de praktijk niet worden nageleefd, bieden geen bescherming.'),

      h2('Mogelijke gevolgen'),
      h3('Voor de opdrachtgever'),
      ul([
        'Naheffing loonbelasting en premies werknemersverzekeringen (AWF, WAO/WIA, ZVW).',
        'Boete tot 100% van de naheffing bij opzet of grove schuld.',
        'Terugvordering van mogelijk te veel afgedragen BTW.',
        'Verplichting tot opbouw van werknemersverzekeringen met terugwerkende kracht.',
      ]),

      h3('Voor de zzp\'er'),
      ul([
        'Verlies van recht op zelfstandigenaftrek en MKB-winstvrijstelling over de betreffende periode.',
        'Mogelijke aanslagen inkomstenbelasting als het inkomen als loon wordt geherkwalificeerd.',
        'In sommige gevallen: aanspraak op werknemersverzekeringen (WW, arbeidsongeschiktheid) - maar dat hangt af van de specifieke situatie.',
      ]),

      {
        type: 'table',
        headers: ['Situatie', 'Naheffing', 'Boete'],
        rows: [
          ['Geen opzet, wel te kwader trouw', 'Tot 5 jaar terug', 'Tot 25%'],
          ['Grove schuld', 'Tot 5 jaar terug', 'Tot 50%'],
          ['Opzet', 'Tot 5 jaar terug', 'Tot 100%'],
          ['Vrijwillige correctie (vóór controle)', 'Tot 5 jaar terug', 'Doorgaans geen of gereduceerde boete'],
        ],
      },

      h2('Hoe bereid je je voor?'),
      h3('Voor zzp\'ers'),
      ol([
        'Controleer al je lopende opdrachtomschrijvingen op DBA-signalen.',
        'Zorg dat je voor meerdere opdrachtgevers werkt of recent hebt gewerkt.',
        'Leg je zelfstandigheid vast: aansprakelijkheidsverzekering, eigen materiaal, KvK-inschrijving.',
        'Bewaar alle contracten en facturen minimaal 7 jaar.',
        'Maak een "zelfstandigheidsdossier" met bewijs van ondernemersactiviteiten.',
        'Gebruik DBA Kompas om je opdrachtomschrijvingen te analyseren.',
      ]),

      h3('Voor opdrachtgevers'),
      ol([
        'Controleer alle inhuurbescheiden op DBA-risico.',
        'Zorg dat de feitelijke werkwijze overeenstemt met de contractuele afspraken.',
        'Overweeg een DBA-scan van je zzp-bestand door een fiscalist.',
        'Maak duidelijke afspraken met intermediairs over de DBA-verantwoordelijkheid.',
      ]),

      tip('Bij twijfel over een lopende opdracht: raadpleeg een belastingadviseur of fiscalist voordat er een controle plaatsvindt. Vrijwillige correctie heeft een aanzienlijk lagere boete dan correctie na een controle.'),

      h2('Bezwaar en beroep'),
      p('Als de Belastingdienst een naheffingsaanslag oplegt, kun je bezwaar maken. De bezwaartermijn is zes weken na de dagtekening van de aanslag. Doe dit altijd schriftelijk en gemotiveerd. Bij afwijzing van het bezwaar kun je in beroep bij de belastingrechter.'),
      tip('Schakel bij een naheffingsaanslag altijd een fiscalist of belastingadviseur in. De inzet en de belangen zijn te groot om dit zelf te doen.'),
    ],
  },

  // ── 6. BTW voor zzp'ers ─────────────────────────────────
  {
    slug: 'btw-voor-zzp',
    title: 'BTW voor zzp\'ers',
    subtitle: 'Aangifte, tarieven, KOR en buitenlandse opdrachten',
    description: 'Alles over BTW als zzp\'er: wanneer je BTW rekent, hoe je aangifte doet, de kleine ondernemersregeling, en wat er geldt bij opdrachten voor buitenlandse klanten.',
    category: 'Fiscaal & Belasting',
    readingTime: 11,
    difficulty: 'basis',
    tags: ['btw', 'omzetbelasting', 'kor', 'aangifte', 'factuur', 'buitenland'],
    blocks: [
      h2('BTW: de basis'),
      p('BTW (Belasting over de Toegevoegde Waarde) is een verbruiksbelasting die je als ondernemer int namens de overheid. Je rekent BTW in rekening aan je klanten en draagt dat af aan de Belastingdienst. De BTW die je zelf betaalt over je zakelijke inkopen mag je aftrekken (voorbelasting).'),
      p('Per saldo betaal je alleen BTW over de toegevoegde waarde - het verschil tussen wat je verkoopt en wat je inkoopt. In de meeste gevallen is het bedrag dat je ontvangt van klanten groter dan wat je zelf betaalt, en moet je per saldo BTW afdragen.'),

      h2('BTW-tarieven in 2025'),
      {
        type: 'table',
        headers: ['Tarief', 'Van toepassing op'],
        rows: [
          ['21%', 'Meeste diensten en producten - het standaardtarief voor zzp\'ers.'],
          ['9%', 'Voedingsmiddelen, geneesmiddelen, boeken, logies, arbeidsintensieve diensten.'],
          ['0%', 'Export buiten de EU, intracommunautaire levering, bepaalde vrijgestelde activiteiten.'],
          ['Vrijgesteld', 'Onderwijs, gezondheidszorg, financiële diensten, sommige culturele activiteiten.'],
        ],
      },

      tip('Als zzp\'er met dienstverlening (IT, advies, schrijven, ontwerp) geldt bijna altijd het 21%-tarief. Twijfel je? Raadpleeg de Belastingdienst website of je boekhouder.'),

      h2('BTW-aangifte: wanneer en hoe?'),
      p('De standaard aangifteperiode is per kwartaal. Je geeft dan in april (Q1), juli (Q2), oktober (Q3) en januari (Q4) je BTW aan. De aangifte moet uiterlijk één maand na afloop van het kwartaal zijn ingediend én betaald.'),

      h3('Maandaangifte'),
      p('Ben je een grotere ondernemer met hoge BTW-bedragen, dan kan de Belastingdienst je verplichten maandelijks aangifte te doen. Voor de meeste zzp\'ers is dit niet van toepassing.'),

      h3('Jaaraangifte'),
      p('Als je BTW-plicht klein is (te betalen BTW minder dan €1.883 per jaar), kun je de Belastingdienst vragen om jaaraangifte. Dit scheelt administratieve belasting.'),

      h2('De Kleine Ondernemersregeling (KOR)'),
      p('De KOR is een vrijstelling voor kleine ondernemers. Als je verwachte omzet (exclusief BTW) niet meer bedraagt dan €20.000 per jaar in Nederland, kun je kiezen voor de KOR.'),

      h3('Voordelen KOR'),
      ul([
        'Geen BTW berekenen aan klanten (je factureert exclusief BTW).',
        'Geen BTW-aangifte meer indienen.',
        'Minder administratie.',
      ]),

      h3('Nadelen KOR'),
      ul([
        'Je kunt geen voorbelasting meer aftrekken - de BTW op jouw inkopen is definitief een kostenpost.',
        'Als je omzet boven €20.000 uitkomt, vervalt de KOR direct per overschrijding (niet per jaareinde).',
        'Klanten die BTW kunnen aftrekken (B2B) kunnen je factuur minder aantrekkelijk vinden.',
        'Je bent gebonden voor minimaal drie jaar na aanmelding.',
      ]),

      warn('De KOR is voordelig bij lage omzet en weinig zakelijke inkopen met BTW. Heb je veel investeringen of zakelijke kosten met BTW? Dan is de KOR waarschijnlijk nadelig - je loopt de aftrek van voorbelasting mis.', 'KOR niet voor iedereen voordelig'),

      h2('Buitenlandse opdrachten'),
      h3('Klanten in de EU (B2B)'),
      p('Lever je diensten aan een BTW-plichtige ondernemer in een ander EU-land? Dan geldt de verleggingsregeling. Je factureert zonder BTW en vermeldt op je factuur: "BTW verlegd / Reverse charge". De klant geeft de BTW aan in zijn eigen land.'),

      h3('Klanten buiten de EU'),
      p('Diensten aan afnemers buiten de EU zijn in de meeste gevallen belast met 0% BTW (of belast in het land van de klant). Controleer de specifieke regels voor jouw type dienst.'),

      h3('Klanten in de EU (B2C/particulieren)'),
      p('Lever je digitale diensten aan particulieren in andere EU-landen? Dan moet je de BTW afdragen in het land van de klant, tenzij je totale omzet in andere EU-landen onder €10.000 per jaar ligt.'),

      imp('BTW-regels voor internationale diensten zijn complex. Vraag advies bij twijfel - een fout kan leiden tot dubbele BTW-heffing of een boete van het buitenlandse belastingkantoor.'),

      h2('BTW op je factuur - de verplichte vermeldingen'),
      ul([
        'Je naam, adres en KvK-nummer.',
        'Je BTW-nummer (NL + 9 cijfers + B + 2 cijfers).',
        'Naam en adres van de klant.',
        'Factuurdatum en een uniek, opeenvolgend factuurnummer.',
        'Omschrijving van de geleverde dienst.',
        'Bedrag exclusief BTW.',
        'BTW-percentage en BTW-bedrag.',
        'Totaalbedrag inclusief BTW.',
        'Betalingstermijn.',
      ]),
    ],
  },

  // ── 7. Aftrekposten zzp'ers ─────────────────────────────
  {
    slug: 'aftrekposten-zzp',
    title: 'Aftrekposten voor zzp\'ers',
    subtitle: 'Zelfstandigenaftrek, startersaftrek, MKB-winstvrijstelling en zakelijke kosten',
    description: 'Een praktisch overzicht van alle aftrekposten die zzp\'ers kunnen benutten in de inkomstenbelasting: van de ondernemersaftrekken tot zakelijke kosten.',
    category: 'Fiscaal & Belasting',
    readingTime: 12,
    difficulty: 'gevorderd',
    tags: ['aftrekposten', 'zelfstandigenaftrek', 'mkb', 'inkomstenbelasting', 'zakelijke kosten'],
    blocks: [
      h2('Welke aftrekposten zijn er?'),
      p('Als zzp\'er met een eenmanszaak of vof betaal je inkomstenbelasting over je winst. Die winst is je omzet min je aftrekbare kosten. Naast gewone zakelijke kosten zijn er specifieke ondernemersaftrekken en vrijstellingen die je winst verder verlagen.'),

      imp('Om gebruik te kunnen maken van de zelfstandigenaftrek en startersaftrek, moet je voldoen aan het urencriterium: minimaal 1.225 uur per jaar aan je onderneming besteden. Dit zijn niet alleen declarabele uren - ook acquisitie, administratie en opleiding tellen mee.'),

      h2('De zelfstandigenaftrek'),
      p('De zelfstandigenaftrek is een vaste aftrek voor ondernemers die aan het urencriterium voldoen. Hij wordt jaarlijks verder afgebouwd.'),

      {
        type: 'table',
        headers: ['Jaar', 'Zelfstandigenaftrek'],
        rows: [
          ['2023', '€5.030'],
          ['2024', '€3.750'],
          ['2025', '€2.470'],
          ['2026', '€1.200'],
          ['2027 (en daarna)', '€900'],
        ],
      },

      warn('De zelfstandigenaftrek wordt de komende jaren sterk afgebouwd. Dit is bewust beleid om de fiscale behandeling van zzp\'ers en werknemers dichter bij elkaar te brengen. Houd rekening met een hogere belastingdruk in 2026 en 2027.', 'Afbouw heeft grote impact'),

      h2('De startersaftrek'),
      p('Ben je een startende ondernemer? Dan heb je recht op een extra aftrek van €2.123 (2025) bovenop de zelfstandigenaftrek. Je mag de startersaftrek maximaal drie keer in de eerste vijf jaar van je onderneming claimen, maar nooit in meer dan drie belastingjaren.'),

      tip('Je hoeft de startersaftrek niet in de eerste drie jaar te claimen. Als je in jaar 1 weinig winst maakt en de aftrek je fiscaal weinig oplevert, kan het voordeliger zijn om te wachten tot een jaar met hogere winst. Overleg dit met je boekhouder.'),

      h2('MKB-winstvrijstelling'),
      p('De MKB-winstvrijstelling is een vrijstelling van 13,31% (2024) over je belastbare winst na aftrek van de ondernemersaftrekken. Je hoeft hier geen uren voor te maken - deze vrijstelling geldt voor alle ondernemers in de inkomstenbelasting.'),
      ex('Stel je hebt €60.000 winst. Na zelfstandigenaftrek (€2.470) is de belastbare winst €57.530. De MKB-winstvrijstelling is 13,31% van €57.530 = €7.657. Jouw belastbare inkomen is dan €57.530 - €7.657 = €49.873.'),

      h2('Zakelijke kosten aftrekken'),
      p('Naast de speciale ondernemersaftrekken mag je alle kosten aftrekken die je redelijkerwijs nodig hebt voor je onderneming. Denk aan:'),

      {
        type: 'table',
        headers: ['Kostensoort', 'Aftrekbaar?', 'Let op'],
        rows: [
          ['Laptop, telefoon, software', 'Ja, volledig indien puur zakelijk', 'Gemengd gebruik: zakelijk deel aftrekbaar'],
          ['Auto (zakelijk)', 'Ja, op basis van werkelijke kosten', 'Of kies voor de bijtelling-regeling'],
          ['Auto (privé, zakelijk gereden km)', '€0,23 per km (2025)', 'Bijhouden via kilometeradministratie'],
          ['Kantoorruimte thuis', 'Beperkt, alleen bij zelfstandige werkruimte', 'Strenge eisen - raadpleeg fiscalist'],
          ['Opleiding en cursussen', 'Ja, indien beroepsgerelateerd', 'Bewaar bewijzen'],
          ['Reiskosten (OV, vliegtickets)', 'Ja, zakelijk deel', 'Bewaar bonnetjes/rekeningen'],
          ['Marketing, website, drukwerk', 'Ja', '-'],
          ['Verzekeringen (AOV, aansprakelijkheid)', 'Ja', '-'],
          ['Lunch/diner met klant', '80% aftrekbaar', 'Bewijs zakelijk karakter'],
          ['Kleding (zakelijk)', 'Alleen specifieke bedrijfskleding', 'Gewone kleding is niet aftrekbaar'],
        ],
      },

      h2('Pensioenopbouw en premieaftrek'),
      p('Als zzp\'er bouw je zelf pensioen op. De premies voor een lijfrenteverzekering of bankspaarproduct zijn aftrekbaar als je een pensioentekort hebt (jaarruimte en reserveringsruimte).'),
      tip('Bereken jaarlijks je jaarruimte. Als je meer verdient dan gemiddeld, kan een forse lijfrentepremie de belastingdruk significant verlagen én je pensioen opbouwen.'),

      h2('Investeringsaftrek (KIA)'),
      p('Investeer je meer dan €2.800 in bedrijfsmiddelen in een kalenderjaar? Dan kun je in aanmerking komen voor de Kleinschaligheidsinvesteringsaftrek (KIA). Dit is een extra aftrek bovenop de normale afschrijving.'),
      tip('Denk aan grote aankopen als een nieuwe laptop (>€2.800 inclusief BTW) of bedrijfsauto. Spreid grote investeringen niet over twee jaren als je daarmee onder de KIA-drempel valt.'),
    ],
  },

  // ── 8. Administratie zzp'ers ────────────────────────────
  {
    slug: 'administratie-zzp',
    title: 'Administratie als zzp\'er',
    subtitle: 'Bewaarplicht, factuureisen, boekhoudtools en jaarafsluiting',
    description: 'Praktische gids voor je financiële administratie als zzp\'er: wat moet je bijhouden, hoe lang bewaren, welke tools zijn er en wat mag je niet vergeten bij de jaarafsluiting.',
    category: 'Administratie & Ondernemen',
    readingTime: 10,
    difficulty: 'basis',
    tags: ['administratie', 'boekhouding', 'factuur', 'bewaarplicht', 'tools', 'aangifte'],
    blocks: [
      h2('Waarom een goede administratie essentieel is'),
      p('Een correcte administratie is niet alleen een wettelijke verplichting - het is ook je bescherming bij een belastingcontrole, je basis voor slimme fiscale beslissingen en het fundament van een gezond ondernemerschap. Zonder goede administratie mis je aftrekposten, loop je risico op boetes en heb je geen grip op je cashflow.'),

      h2('Bewaarplicht: wat en hoe lang?'),
      p('Je bent wettelijk verplicht je administratie minimaal 7 jaar te bewaren. Voor onroerende zaken geldt zelfs 10 jaar. Dit geldt voor alle stukken die relevant zijn voor de belastingaangifte.'),

      {
        type: 'table',
        headers: ['Type document', 'Bewaartermijn'],
        rows: [
          ['Facturen (inkomend en uitgaand)', '7 jaar'],
          ['Bankafschriften', '7 jaar'],
          ['Contracten en overeenkomsten', '7 jaar (of langer bij langlopende verplichtingen)'],
          ['BTW-aangiften', '7 jaar'],
          ['Jaarrekeningen', '7 jaar'],
          ['Urenadministratie (voor urencriterium)', '7 jaar'],
          ['Kassabonnen en bonnetjes', '7 jaar'],
          ['Onroerende zaken (huur, aankoop)', '10 jaar'],
        ],
      },

      tip('Bewaar alles digitaal in een georganiseerde mapstructuur: per jaar, dan per maand, dan per type document. Gebruik een clouddienst zodat je backups hebt.'),

      h2('Factuureisen'),
      p('Een factuur die je stuurt aan een zakelijke klant moet aan specifieke wettelijke eisen voldoen. Een ontbrekend element kan problemen geven bij BTW-aftrek.'),
      ul([
        'Volledige naam en adres van jou en de klant.',
        'KvK-nummer.',
        'BTW-identificatienummer (als je BTW-plichtig bent).',
        'Uniek, opeenvolgend factuurnummer.',
        'Factuurdatum.',
        'Duidelijke omschrijving van de geleverde dienst.',
        'Hoeveelheid of omvang van de dienst.',
        'Bedrag exclusief BTW per tarief.',
        'BTW-tarief (21%, 9%, 0%) en BTW-bedrag.',
        'Totaalbedrag inclusief BTW.',
        'Betalingstermijn (aanbevolen).',
        'Bankrekening of IBAN (aanbevolen).',
      ]),

      ex('Gebruik je de KOR (Kleine Ondernemersregeling)? Dan factureer je zonder BTW en vermeldt je: "BTW niet van toepassing op grond van artikel 25 Wet OB 1968".'),

      h2('Bijhouden van je administratie: de basis'),
      h3('Wat je wekelijks bijhoudt'),
      ul([
        'Verkoopfacturen: verzend ze tijdig en boek ze in je administratie.',
        'Inkoopfacturen: bewaar alle bonnen en facturen voor zakelijke uitgaven.',
        'Bankafschriften: controleer en categoriseer elke transactie.',
      ]),

      h3('Wat je maandelijks doet'),
      ul([
        'BTW-verwerking: check welke BTW je hebt ontvangen en betaald.',
        'Openstaande facturen bewaken: stuur herinneringen als betalingen uitblijven.',
        'Kilometeradministratie bijwerken (indien relevant voor zakelijke reizen).',
      ]),

      h3('Wat je elk kwartaal doet'),
      ul([
        'BTW-aangifte indienen en betalen (of afdragen via maand- of jaaraangifte).',
        'Check of je liquiditeit voldoende is voor de belastingaanslagen.',
      ]),

      h2('Boekhoudtools voor zzp\'ers'),
      {
        type: 'table',
        headers: ['Tool', 'Geschikt voor', 'Prijs (indicatief)'],
        rows: [
          ['Moneybird', 'Eenvoudige administratie, mooie interface', '€12-€32/maand'],
          ['Boekhoudgemak (Belastingdienst)', 'Startende zzp\'ers, gratis', 'Gratis'],
          ['Exact Online', 'Groeiende zzp\'ers, koppeling met accountant', '€30-€60/maand'],
          ['Twinfield', 'Meer complexe administraties, boekhouders', 'Op aanvraag'],
          ['E-boekhouden', 'Uitgebreid, relatief betaalbaar', '€10-€20/maand'],
          ['Snelstart', 'Lokale software, veelgebruikt door accountants', '€12-€30/maand'],
        ],
      },

      tip('Kies een tool die koppelt met je bank (automatische transactie-import) en die een directe export heeft naar je belastingadviseur. Dat scheelt uren per jaar.'),

      h2('Jaarafsluiting'),
      p('Aan het einde van het belastingjaar (31 december) sluit je je administratie af en stel je je winst-en-verliesrekening op. Dit is de basis voor je aangifte inkomstenbelasting (IB), die je indient vóór 1 mei van het volgende jaar (of later met uitstel via je fiscalist).'),

      h3('Checklist jaarafsluiting'),
      ol([
        'Alle facturen en bonnen gescand en geboekt.',
        'Bank volledig afgeletterd (alle transacties verklaard).',
        'Openstaande debiteuren gecontroleerd en zo nodig afgeboekt.',
        'Jaarrekening opgesteld (balans + resultatenrekening).',
        'Urenadministratie gecontroleerd op urencriterium (≥1.225 uur).',
        'Privéonttrekkingen en -stortingen verwerkt.',
        'Belastingschuld/-vordering begroot.',
        'Aangifte IB voorbereid of doorgezet naar fiscalist.',
      ]),

      warn('Vergeet niet een voorziening te treffen voor de belasting die je nog moet betalen. Als je geen rekening houdt met je belastingschuld, kom je aan het einde van het jaar voor onaangename verrassingen te staan.', 'Reserveer voor belasting'),
    ],
  },

  // ── 9. Opdrachtovereenkomst ──────────────────────────────
  {
    slug: 'opdrachtovereenkomst',
    title: 'De opdrachtovereenkomst',
    subtitle: 'Welke clausules beschermen jou - en welke risico\'s loer je over het hoofd?',
    description: 'Een grondige gids over de opdrachtovereenkomst voor zzp\'ers: welke bepalingen zijn essentieel, hoe onderhandel je over lastige clausules en wat zegt de wet?',
    category: 'Administratie & Ondernemen',
    readingTime: 13,
    difficulty: 'gevorderd',
    tags: ['contract', 'overeenkomst', 'clausule', 'aansprakelijkheid', 'ip', 'geheimhouding'],
    blocks: [
      h2('De opdrachtovereenkomst als fundament'),
      p('De opdrachtovereenkomst (ook wel opdrachtencontract of freelancecontract) legt de relatie tussen jou en je opdrachtgever juridisch vast. Het is niet alleen een DBA-document - het regelt je betaling, aansprakelijkheid, intellectueel eigendom, geheimhouding en beëindiging.'),
      p('Veel zzp\'ers ondertekenen de standaardovereenkomst van de opdrachtgever zonder deze grondig te lezen. Dat is risicovol: de meeste standaardcontracten zijn geschreven in het belang van de opdrachtgever, niet van de zzp\'er.'),

      imp('Lees elk contract zorgvuldig. Bepaalde clausules kunnen je aansprakelijkheid onbeperkt maken, je eigendom van je werk wegnemen of je rechten op betaling beperken.'),

      h2('De essentiële bepalingen'),

      h3('1. Partijen en voorwerp'),
      p('Beschrijf duidelijk wie de opdrachtgever en opdrachtnemer zijn (volledige namen, KvK-nummers, adressen) en wat de opdracht inhoudt. Vaagheid hier creëert later discussie.'),

      h3('2. Resultaat en acceptatiecriteria'),
      p('Definieer wat er opgeleverd wordt en wanneer dat wordt geaccepteerd. Zonder acceptatiecriteria kan een opdrachtgever oneindig verbeteringen eisen zonder dat je een eindpunt hebt.'),
      ex('"De opdrachtnemer levert [X] op. De opdrachtgever beoordeelt de oplevering binnen 5 werkdagen na ontvangst. Bij het uitblijven van een reactie wordt de oplevering geacht te zijn geaccepteerd."'),

      h3('3. Vergoeding en betaaltermijn'),
      p('Leg het tarief, de facturatiemomenten en de betalingstermijn vast. Gebruik een redelijke betalingstermijn (14-30 dagen is gangbaar voor zzp\'ers).'),
      tip('Voeg toe: "Bij te late betaling is de opdrachtgever zonder ingebrekestelling de wettelijke handelsrente verschuldigd." Dit geeft je automatisch aanspraak op rente zonder vooraf aanmaningen te moeten sturen.'),

      h3('4. Looptijd en beëindiging'),
      p('Geef aan wanneer de opdracht begint en eindigt. Definieer ook de opzegtermijn voor tussentijdse beëindiging.'),
      warn('Vermijd te lange opzegtermijnen in het nadeel van de zzp\'er. Een bepaling als "de opdrachtgever kan per direct beëindigen zonder vergoeding" is oneerlijk - probeer een minimale vergoeding of opzegtermijn te bedingen.'),

      h3('5. Vrije vervanging'),
      p('Neem op dat je het werk mag (laten) uitvoeren door een andere persoon, mits die beschikt over de vereiste kwalificaties. Dit is ook cruciaal voor DBA-compliance.'),

      h3('6. Aansprakelijkheid'),
      p('Begrens je aansprakelijkheid. Een onbeperkte aansprakelijkheidsclausule kan betekenen dat je verantwoordelijk bent voor schade die het viervoudige van je opdrachtswaarde overtreft.'),
      ex('"De aansprakelijkheid van de opdrachtnemer is beperkt tot het bedrag dat in het kader van deze overeenkomst is gefactureerd in de drie maanden voorafgaand aan het schadeveroorzakende event, of het bedrag dat de verzekeraar uitkeert, indien dit hoger is."'),

      h3('7. Intellectueel eigendom (IP)'),
      p('Wat gebeurt er met wat je maakt? Standaard geldt in Nederland dat de maker het auteursrecht behoudt, maar contractueel kan dit worden overgedragen.'),
      {
        type: 'table',
        headers: ['Variant', 'Betekenis voor jou'],
        rows: [
          ['IP blijft bij opdrachtnemer, licentie aan opdrachtgever', 'Jij behoudt het werk, opdrachtgever mag het gebruiken. Sterk voor zzp\'er.'],
          ['IP wordt overgedragen bij betaling', 'Opdrachtgever krijgt volledige eigendom. Zorg dan dat het tarief dit reflecteert.'],
          ['IP bij oplevering en acceptatie overgedragen', 'Veelgebruikt. Let op dat de overdracht pas na volledige betaling plaatsvindt.'],
        ],
      },
      tip('Voeg toe: "Overdracht van intellectuele eigendomsrechten vindt uitsluitend plaats na volledige betaling van de overeengekomen vergoeding." Zo heb je leverage als een opdrachtgever niet betaalt.'),

      h3('8. Geheimhouding'),
      p('Vrijwel elk contract bevat een geheimhoudingsclausule. Let op de scope (wat is vertrouwelijk?), de looptijd (hoe lang geldt de geheimhouding?), en de uitzonderingen (openbaar bekende informatie, wettelijke verplichtingen).'),

      h3('9. Toepasselijk recht en geschillenbeslechting'),
      p('Zorg dat Nederlands recht van toepassing is. Een forumkeuze voor de rechtbank in jouw vestigingsplaats is ook voordelig.'),

      h2('Rode vlaggen in contracten'),
      ul([
        'Onbeperkte aansprakelijkheid of boetes bij "wanprestatie" zonder definitie van wat dat is.',
        '"Work for hire" - waarbij al je creatieve output automatisch eigendom van de opdrachtgever wordt.',
        'Concurrentiebeding dat je na de opdracht verhindert voor vergelijkbare opdrachtgevers te werken.',
        'Eenzijdig opzeggingsrecht voor de opdrachtgever zonder vergoeding.',
        'Verplichting tot exclusiviteit (werken voor slechts één opdrachtgever tegelijk).',
        'Facturatieverbod zonder expliciete goedkeuring van elk uur.',
      ]),

      h2('Onderhandelen over ongunstige clausules'),
      p('De meeste opdrachtgevers hebben standaardcontracten maar zijn bereid redelijke aanpassingen te accepteren. Benader dit zakelijk en schriftelijk.'),
      tip('Gebruik de techniek: "Ik begrijp wat dit clausule wil bereiken. Ik stel voor dit aan te passen naar: [jouw alternatief]. Is dat akkoord?" Dit toont begrip en professionaliteit terwijl je toch beschermd bent.'),
    ],
  },

  // ── 10. Pensioen als zzp'er ─────────────────────────────
  {
    slug: 'pensioen-zzp',
    title: 'Pensioenopbouw als zzp\'er',
    subtitle: 'Van lijfrente tot banksparen - jouw opties concreet uitgelegd',
    description: 'Als zzp\'er bouw je geen pensioen op via een werkgever. Ontdek welke mogelijkheden je hebt, hoe de fiscale aftrek werkt en hoe je een pensioenstrategie kiest die bij jou past.',
    category: 'Fiscaal & Belasting',
    readingTime: 13,
    difficulty: 'gevorderd',
    tags: ['pensioen', 'lijfrente', 'banksparen', 'aov', 'jaarruimte', 'reserveringsruimte'],
    blocks: [
      h2('Het pensioenprobleem van de zzp\'er'),
      p('Als werknemer bouw je automatisch pensioen op via je werkgever - verplicht deelname aan een pensioenfonds. Als zzp\'er heb je dit niet. Je ontvangt wel AOW (Algemene Ouderdomswet) zodra je de AOW-leeftijd bereikt (67 jaar in 2025, en stijgt mee met de levensverwachting), maar dat is slechts een basisinkomen dat voor de meeste zzp\'ers niet toereikend is.'),

      imp('Veel zzp\'ers realiseren zich pas laat dat hun pensioenpot veel te klein is. Begin vroeg. Zelfs kleine maandelijkse bijdragen, consequent opgebouwd, maken een enorm verschil door rente-op-rente.'),

      h2('Je opties voor pensioenopbouw'),

      h3('1. Lijfrenteverzekering'),
      p('Een lijfrenteverzekering is een product bij een verzekeraar waarbij je premie belastingaftrekbaar is in het jaar dat je deze betaalt. Bij uitkering betaal je inkomstenbelasting - maar dan waarschijnlijk in een lager belastingtarief dan nu.'),
      ul([
        'Premie is aftrekbaar van je belastbaar inkomen (tot jaarruimte).',
        'Uitkering belast als inkomen.',
        'Minder flexibel dan banksparen.',
        'Biedt aanvullende dekking bij overlijden of arbeidsongeschiktheid mogelijk.',
      ]),

      h3('2. Lijfrenterekening (banksparen)'),
      p('Banksparen is een vorm van lijfrente bij een bank in plaats van een verzekeraar. Dezelfde fiscale voordelen, maar meer transparantie en doorgaans lagere kosten.'),
      ul([
        'Zelfde fiscale aftrek als lijfrenteverzekering.',
        'Lagere kosten dan traditionele verzekeringen.',
        'Meer controle over beleggingskeuzes.',
        'Geen overlijdensdekking (maar je saldo gaat wel naar erfgenamen).',
      ]),

      h3('3. Vrijwillige deelname aan pensioenfonds'),
      p('Sommige bedrijfstakpensioenfondsen bieden zzp\'ers de mogelijkheid vrijwillig deel te nemen. Vraag na of dit mogelijk is in jouw sector.'),

      h3('4. Beleggen in box 3'),
      p('Je kunt ook zelf beleggen via een gewone beleggingsrekening. Het voordeel is volledige flexibiliteit. Het nadeel is dat je geen belastingaftrek geniet en dat het vermogen belast wordt in box 3 (vermogensrendementsheffing).'),

      h3('5. Pensioen via de BV (DGA-pensioen)'),
      p('Werk je via een BV als directeur-grootaandeelhouder (DGA)? Dan kun je een salaris uit je BV nemen en via een extern pensioenfonds of verzekeraar pensioen opbouwen. Dit vereist aparte planning - vraag een fiscalist.'),

      h2('Jaarruimte: hoeveel mag je aftrekken?'),
      p('De jaarruimte bepaalt hoeveel premie je maximaal fiscaal aftrekbaar kunt storten in een lijfrenteproduct. De berekening is:'),
      ex('Jaarruimte = 30% × (inkomen − AOW-franchise) − 6,27 × opgebouwde pensioenaanspraken (als werknemer).\n\nAls zzp\'er met €80.000 inkomen, geen pensioenopbouw als werknemer en een AOW-franchise van ca. €14.000:\nJaarruimte = 30% × (€80.000 − €14.000) = 30% × €66.000 = €19.800', 'Berekening jaarruimte (2025, indicatief)'),

      tip('Bereken je jaarruimte elk jaar opnieuw. De bedragen wijzigen jaarlijks. Gebruik de rekentool van de Belastingdienst of vraag je fiscalist.'),

      h2('Reserveringsruimte: inhalen van gemiste jaren'),
      p('Heb je in voorgaande jaren geen of weinig pensioen opgebouwd? Dan kun je de gemiste jaarruimte van de afgelopen 10 jaar alsnog benutten via de reserveringsruimte. Er geldt een maximumbedrag per jaar.'),
      imp('De reserveringsruimte biedt een uitstekende kans voor zzp\'ers die laat zijn begonnen met pensioenopbouw om belastingvoordeel te benutten én een achterstand in te halen.'),

      h2('AOV: arbeidsongeschiktheidsverzekering'),
      p('Naast pensioen is de AOV (Arbeidsongeschiktheidsverzekering) cruciaal. Als zzp\'er heb je geen aanspraak op WIA of WW. Als je uitvalt door ziekte of een ongeluk, heb je zonder AOV geen inkomen.'),

      warn('Vanaf 2027 wordt een AOV voor zzp\'ers verplicht gesteld via een collectieve basisverzekering. De details zijn nog niet volledig uitgewerkt, maar de richting is duidelijk: als je nog geen AOV hebt, bereid je voor.', 'Verplichte AOV per 2027'),

      {
        type: 'table',
        headers: ['Type AOV', 'Voordelen', 'Nadelen'],
        rows: [
          ['Traditionele AOV', 'Volledig maatwerk, optimale dekking', 'Hoge premie, uitgebreide acceptatieprocedure'],
          ['Collectieve branche-AOV', 'Lagere premie, geen medische keuring', 'Minder maatwerk'],
          ['Arbeidsongeschiktheidsverzekering Broodfonds', 'Goedkoop, gemeenschap-model', 'Beperkte dekking, max 2,5 jaar'],
          ['Vrijwillig ziekengeld Zorgverzekeringswet', 'Aanvulling op AOV', 'Beperkt, enkel voor ZVW-gerelateerd'],
        ],
      },

      tip('Plan je pensioenstrategie samen met een onafhankelijk financieel adviseur of fiscalist. De optimale combinatie van jaarruimte, lijfrente, beleggingen en AOV hangt af van je persoonlijke situatie, inkomen en leeftijd.'),
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Hulpfuncties voor gebruik in pagina's
// ─────────────────────────────────────────────────────────────

export function getGuide(slug: string): GuideEntry | undefined {
  return GUIDES.find(g => g.slug === slug)
}

export const CATEGORIES = [...new Set(GUIDES.map(g => g.category))]
