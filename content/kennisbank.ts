export type KennisbankSection = {
  h2: string;
  body: string;
};

export type KennisbankFaq = {
  question: string;
  answer: string;
};

export type KennisbankPage = {
  slug: string;
  title: string;
  h1: string;
  shortDescription: string;
  answerBlock: string;
  laatstBijgewerkt: string;
  sections: KennisbankSection[];
  faq: KennisbankFaq[];
  relatedSlugs: string[];
};

export const KENNISBANK_PAGES: KennisbankPage[] = [
  {
    slug: "wet-dba",
    title: "Wat is de Wet DBA?",
    h1: "Wat is de Wet DBA?",
    shortDescription:
      "Het Nederlandse kader voor de beoordeling van arbeidsrelaties tussen opdrachtgevers en zzp'ers. Handhaving sinds 2025 weer actief.",
    answerBlock:
      "De Wet DBA (Wet Deregulering Beoordeling Arbeidsrelaties) is de Nederlandse wet die sinds 2016 het kader vormt voor de beoordeling van arbeidsrelaties tussen opdrachtgevers en zzp'ers. De wet bepaalt mee wanneer iemand als zelfstandige werkt en wanneer feitelijk sprake is van een dienstverband. Sinds 1 januari 2025 handhaaft de Belastingdienst weer actief op schijnzelfstandigheid.",
    laatstBijgewerkt: "mei 2026",
    sections: [
      {
        h2: "Waarom bestaat de Wet DBA?",
        body: "De Wet DBA verving in 2016 de VAR (Verklaring Arbeidsrelatie). Het doel: helderheid scheppen over wanneer iemand zelfstandige is en wanneer werknemer. De Wet DBA werkt samen met de wettelijke definitie van een arbeidsovereenkomst in artikel 7:610 BW (arbeid, loon en gezag) en de jurisprudentie van de Hoge Raad.",
      },
      {
        h2: "Wat is er per 1 januari 2025 veranderd?",
        body: "Het handhavingsmoratorium, de periode waarin de Belastingdienst niet actief handhaafde, is per 1 januari 2025 opgeheven. Sindsdien gelden weer de normale regels en handhaaft de Belastingdienst weer op schijnzelfstandigheid. Er is geen nieuw toetsingskader: de beoordeling gebeurt op basis van de Wet DBA, artikel 7:610 BW en de Hoge Raad-jurisprudentie, met name het Deliveroo-arrest.",
      },
      {
        h2: "Voor wie geldt de Wet DBA?",
        body: "De Wet DBA geldt voor de beoordeling van arbeidsrelaties tussen opdrachtgevers en zelfstandigen zonder personeel (zzp'ers). Voor zzp'ers zelf gold nooit een handhavingsmoratorium: een naheffing bij een opdrachtgever kan aanleiding zijn om ook de aangiften van de betrokken zzp'er(s) opnieuw te beoordelen.",
      },
    ],
    faq: [
      {
        question: "Geldt de Wet DBA ook voor opdrachten via een intermediair?",
        answer:
          "Ja. De Belastingdienst kijkt naar de feitelijke arbeidsrelatie, niet naar wie het contract afsluit. Een intermediair, brokerdienst of MSP-constructie verandert niets aan hoe in de praktijk wordt gewerkt.",
      },
      {
        question: "Is een modelovereenkomst nog nodig?",
        answer:
          "Goedgekeurde lopende modelovereenkomsten worden geëerbiedigd tot eind 2029. Belangrijk: de modelovereenkomst beschermt alleen als de feitelijke werkwijze er ook bij past.",
      },
      {
        question: "Wat als ik al jaren bij dezelfde opdrachtgever werk?",
        answer:
          "De duur bij een opdrachtgever is een van de gezichtspunten in de holistische toets. Lange relaties roepen eerder vragen op rond inbedding en aansturing. De Belastingdienst kijkt naar de totale duur, niet naar afzonderlijke projecten.",
      },
    ],
    relatedSlugs: ["schijnzelfstandigheid", "deliveroo-criteria", "handhaving-2026"],
  },
  {
    slug: "schijnzelfstandigheid",
    title: "Wat is schijnzelfstandigheid?",
    h1: "Wat is schijnzelfstandigheid?",
    shortDescription:
      "Formeel zzp'er, feitelijk werknemer. Hoe de Belastingdienst dit beoordeelt en welke gevolgen het kan hebben.",
    answerBlock:
      "Schijnzelfstandigheid betekent dat iemand formeel als zzp'er werkt, terwijl er volgens het arbeidsrecht feitelijk sprake is van een dienstverband. Niet de vorm van het contract is doorslaggevend, maar hoe er in de praktijk wordt gewerkt. Wie langdurig voor een opdrachtgever werkt, onder aansturing staat en is ingebed in de organisatie, loopt eerder risico op die kwalificatie.",
    laatstBijgewerkt: "mei 2026",
    sections: [
      {
        h2: "Wanneer is sprake van schijnzelfstandigheid?",
        body: "De Belastingdienst beoordeelt of er feitelijk een arbeidsovereenkomst bestaat, op basis van de wettelijke definitie (arbeid, loon, gezag) en de negen gezichtspunten uit het Deliveroo-arrest. Geen enkel punt is op zichzelf beslissend; het gaat om het totaalbeeld (de holistische toets).",
      },
      {
        h2: "Welke risico-indicatoren zijn er?",
        body: "Belangrijke risico-indicatoren: langdurige relatie met dezelfde opdrachtgever, inbedding in de organisatie, aansturing door een leidinggevende, vaste werktijden, geen eigen middelen, geen commercieel risico, weinig andere opdrachtgevers. Deze punten worden in samenhang bekeken.",
      },
      {
        h2: "Wat zijn de gevolgen voor zzp'ers?",
        body: "Bij vastgestelde schijnzelfstandigheid kan de Belastingdienst de aangiften van de zzp'er herbeoordelen. Daarnaast kan de opdracht door de opdrachtgever worden herzien of niet worden verlengd. Voor opdrachtgevers gelden naheffingen loonheffingen en sinds 1 januari 2026 vergrijpboetes bij opzet of grove schuld.",
      },
    ],
    faq: [
      {
        question: "Hoe weet ik of mijn opdracht risico loopt?",
        answer:
          "Toets de opdracht op de drie kernpunten: aansturing en gezag, eigen rekening en risico, en ondernemerschap. DBA Kompas helpt je dat snel inzichtelijk te maken. De uitkomst is indicatief en vervangt geen juridisch advies.",
      },
      {
        question: "Wat doet de Belastingdienst bij vermoeden van schijnzelfstandigheid?",
        answer:
          "Bij vermoeden start in beginsel een bedrijfsbezoek bij de opdrachtgever (een licht, oriënterend instrument). Voor een naheffing loonheffingen is een zwaardere boekenonderzoek nodig.",
      },
    ],
    relatedSlugs: ["wet-dba", "deliveroo-criteria", "handhaving-2026"],
  },
  {
    slug: "deliveroo-criteria",
    title: "De negen Deliveroo-criteria",
    h1: "De negen Deliveroo-criteria",
    shortDescription:
      "De negen gezichtspunten uit het Hoge Raad-arrest van 2023, vertaald naar de praktijk en samengevat in drie kernthema's.",
    answerBlock:
      "De Deliveroo-criteria zijn negen gezichtspunten die de Hoge Raad in 2023 heeft benoemd om te beoordelen of er sprake is van een arbeidsovereenkomst. De Belastingdienst gebruikt deze gezichtspunten bij de beoordeling van arbeidsrelaties. Ze worden in onderlinge samenhang bekeken: geen enkel punt is op zichzelf beslissend, het gaat om het totaalbeeld.",
    laatstBijgewerkt: "mei 2026",
    sections: [
      {
        h2: "Wat zijn de negen gezichtspunten?",
        body: "1. De aard en duur van de werkzaamheden.\n2. De wijze waarop werkzaamheden en werktijden worden bepaald.\n3. De inbedding van het werk en de werker in de organisatie en bedrijfsvoering van de opdrachtgever.\n4. Het al dan niet bestaan van een verplichting het werk persoonlijk uit te voeren.\n5. De wijze waarop de contractuele verhouding tussen partijen tot stand is gekomen.\n6. De wijze waarop de beloning wordt bepaald en uitgekeerd.\n7. De hoogte van de beloning.\n8. Of de werker commercieel risico loopt.\n9. Of de werker zich in het economisch verkeer als ondernemer gedraagt of kan gedragen.",
      },
      {
        h2: "Hoe vertaalt DBA Kompas deze naar drie kernpunten?",
        body: "De negen gezichtspunten zijn samen te vatten in drie kernthema's:\n\nAansturing en gezag (gezichtspunten 1, 2, 3, 4): wie bepaalt hoe en wanneer je werkt.\n\nEigen rekening en risico (gezichtspunten 6, 7, 8): wie draagt het risico en de kosten.\n\nOndernemerschap (gezichtspunt 9): of je je als ondernemer gedraagt.\n\nGezichtspunt 5 dient als context.",
      },
      {
        h2: "Wat betekent de holistische toets?",
        body: "Geen enkel gezichtspunt is op zichzelf beslissend. De Belastingdienst weegt de negen punten in onderlinge samenhang en kijkt naar het totaalbeeld. Een sterk punt op ondernemerschap kan een zwak punt op aansturing deels compenseren, maar niet volledig wegnemen.",
      },
    ],
    faq: [
      {
        question: "Wanneer is de Deliveroo-uitspraak gedaan?",
        answer:
          "Op 24 maart 2023 deed de Hoge Raad de uitspraak in de Deliveroo-zaak. Deze uitspraak vormt sindsdien het kader voor de beoordeling van arbeidsrelaties.",
      },
      {
        question: "Is dit kader bindend voor de Belastingdienst?",
        answer:
          "De Belastingdienst gebruikt de Deliveroo-gezichtspunten bij de beoordeling. Het is geen vinkjes-lijst maar een holistische toets.",
      },
    ],
    relatedSlugs: ["wet-dba", "schijnzelfstandigheid", "handhaving-2026"],
  },
  {
    slug: "zelfstandigenwet",
    title: "De nieuwe wetgeving rond zelfstandigen",
    h1: "De nieuwe wetgeving rond zelfstandigen",
    shortDescription:
      "Wat verandert er rond de Wet VBAR, het rechtsvermoeden bij laag uurtarief en de aankomende Zelfstandigenwet?",
    answerBlock:
      "De wetgeving rond zzp-werk verandert. Het kabinet heeft besloten het verduidelijkingsdeel van de Wet VBAR te schrappen en te vervangen door een afzonderlijke Zelfstandigenwet, waarin het ondernemerschap van de werkende centraal staat. Het onderdeel rechtsvermoeden van de VBAR, voor zelfstandigen met een laag uurtarief, blijft wel bestaan. Tot de nieuwe wetgeving is aangenomen, blijft het huidige kader gelden.",
    laatstBijgewerkt: "mei 2026",
    sections: [
      {
        h2: "Wat is de Wet VBAR?",
        body: "De Wet VBAR (Verduidelijking Beoordeling Arbeidsrelaties en Rechtsvermoeden) is op 7 juli 2025 bij de Tweede Kamer ingediend. Het kabinet-Jetten heeft besloten het verduidelijkingsdeel van de VBAR te schrappen. Wat van de VBAR overblijft, is het onderdeel rechtsvermoeden.",
      },
      {
        h2: "Wat houdt het rechtsvermoeden in?",
        body: "Het rechtsvermoeden van werknemerschap geldt voor zelfstandigen die werken tegen een laag uurtarief (in de communicatie is een richtbedrag van circa 36 tot 38 euro per uur genoemd, peildatum begin 2026). Werkt iemand onder dat tarief, dan kan hij zich op het rechtsvermoeden beroepen en verschuift de bewijslast naar de opdrachtgever.",
      },
      {
        h2: "Wat wordt de Zelfstandigenwet?",
        body: "De Zelfstandigenwet kiest een ander vertrekpunt dan de VBAR: niet het gezag, maar het ondernemerschap van de werkende staat centraal. De wet werkt met een zelfstandigentoets en een werkrelatietoets, en legt de nadruk op vooraf duidelijkheid geven in plaats van achteraf beoordelen. De Zelfstandigenwet is op het moment van schrijven nog niet als wetsvoorstel ingediend en moet het volledige wetgevingsproces nog doorlopen.",
      },
      {
        h2: "Wat geldt er totdat de nieuwe wetgeving is aangenomen?",
        body: "Tot de Zelfstandigenwet is aangenomen, blijft het huidige kader gelden: Wet DBA, artikel 7:610 BW en de jurisprudentie van de Hoge Raad (met name het Deliveroo-arrest). De Belastingdienst handhaaft sinds 1 januari 2025 weer op schijnzelfstandigheid op basis van dit kader.",
      },
    ],
    faq: [
      {
        question: "Wanneer treedt de Zelfstandigenwet in werking?",
        answer:
          "Geen vaste datum bekend. Invoering wordt gefaseerd voorzien zodra de wet het wetgevingsproces heeft doorlopen.",
      },
      {
        question: "Wat verandert het rechtsvermoeden voor mij?",
        answer:
          "Als je onder het rechtsvermoeden-tarief werkt, kan je je daarop beroepen. De bewijslast voor zelfstandig ondernemerschap verschuift dan naar de opdrachtgever.",
      },
    ],
    relatedSlugs: ["wet-dba", "handhaving-2026"],
  },
  {
    slug: "handhaving-2026",
    title: "Hoe handhaaft de Belastingdienst nu?",
    h1: "Hoe handhaaft de Belastingdienst nu?",
    shortDescription:
      "Zachte landing sinds 2025: bedrijfsbezoeken, boekenonderzoeken, naheffingen en boetes. Wat geldt in 2026?",
    answerBlock:
      "Sinds 1 januari 2025 handhaaft de Belastingdienst weer op schijnzelfstandigheid. De handhaving verloopt met een zachte landing: bij een vermoeden start in beginsel een bedrijfsbezoek, en in 2026 worden geen verzuimboetes opgelegd. Naheffingen loonheffingen blijven mogelijk na een boekenonderzoek, en vergrijpboetes kunnen bij opzet of grove schuld worden opgelegd.",
    laatstBijgewerkt: "mei 2026",
    sections: [
      {
        h2: "Wat is de zachte landing?",
        body: "De Belastingdienst handhaaft risicogericht. Bij een vermoeden van schijnzelfstandigheid start in beginsel een bedrijfsbezoek, een relatief licht, oriënterend instrument. Op basis daarvan kan geen naheffing volgen, wel een waarschuwing. Voor een naheffing loonheffingen is een boekenonderzoek nodig.",
      },
      {
        h2: "Wanneer komen er boetes?",
        body: "In 2026 worden geen verzuimboetes opgelegd (de administratieve boetes voor fouten zonder opzet). Vergrijpboetes, voor situaties van opzet of grove schuld, zijn vanaf 1 januari 2026 wel mogelijk.",
      },
      {
        h2: "Hoe ver kan een naheffing terugwerken?",
        body: "Naheffen kan met terugwerkende kracht, maar niet verder terug dan 1 januari 2025, tenzij sprake is van kwaadwillendheid of het niet opvolgen van een eerdere aanwijzing. Goedgekeurde lopende modelovereenkomsten worden geëerbiedigd tot eind 2029.",
      },
      {
        h2: "Wat betekent dit voor zzp'ers?",
        body: "Voor zzp'ers gold nooit een handhavingsmoratorium. Een naheffing bij een opdrachtgever kan aanleiding zijn om ook de aangiften van de betrokken zzp'er(s) opnieuw te beoordelen. Dit benadrukt het belang om je opdracht vooraf te toetsen.",
      },
    ],
    faq: [
      {
        question: "Wat is het verschil tussen een bedrijfsbezoek en boekenonderzoek?",
        answer:
          "Een bedrijfsbezoek is een lichter, oriënterend instrument bij vermoeden van schijnzelfstandigheid. Een boekenonderzoek is zwaarder en kan leiden tot een naheffing loonheffingen.",
      },
      {
        question: "Wat is een vergrijpboete?",
        answer:
          "Een vergrijpboete kan worden opgelegd bij opzet of grove schuld bij het niet naleven van de Wet DBA. Sinds 1 januari 2026 mogelijk; verzuimboetes worden in 2026 nog niet opgelegd.",
      },
    ],
    relatedSlugs: ["wet-dba", "schijnzelfstandigheid", "zelfstandigenwet"],
  },
];

export const KENNISBANK_INDEX = KENNISBANK_PAGES.map((p) => ({
  slug: p.slug,
  h1: p.h1,
  shortDescription: p.shortDescription,
}));

export function findKennisbankPage(slug: string): KennisbankPage | undefined {
  return KENNISBANK_PAGES.find((p) => p.slug === slug);
}
