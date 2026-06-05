export const LANDING = {
  nav: {
    brand: "DBA Kompas",
    pricing: "Prijzen",
    features: "Functies",
    faq: "FAQ",
    login: "Ga naar de app",
    tryNow: "Start je gratis zelfscan",
    goToApp: "Ga naar app",
  },

  hero: {
    title: "Toets je zzp-opdracht",
    titleHighlight: "voordat je het gesprek aangaat",
    subtitle:
      "Plak je opdracht of upload een document. Binnen een minuut zie je waar je opdracht vragen oproept, met concrete aandachtspunten en een herschreven opdrachtbrief.",
    supporting: "Ontdek in 1 minuut of jouw opdracht op belangrijke punten vragen oproept.",
    ctaPrimary: "Start je gratis zelfscan",
    ctaSecondary: "Toets je opdracht voor €9,95",
    trustLine: "Van opdrachtomschrijving naar duidelijke aandachtspunten en gerichte vervolgstappen.",
  },

  appDemo: {
    title: "Bekijk de app in actie",
    subtitle: "Zo werkt het in de app.",
  },

  steps: {
    title: "In vier stappen naar meer duidelijkheid",
    subtitle: "Van invoer naar inzicht, zonder onnodige complexiteit.",
    items: [
      {
        step: 1,
        title: "Start met je opdrachtomschrijving",
        description:
          "Upload je document of plak de tekst direct in de app.",
      },
      {
        step: 2,
        title: "Bekijk je risico-indicatie",
        description:
          "De app signaleert waar aandachtspunten zitten in je opdrachtomschrijving.",
      },
      {
        step: 3,
        title: "Verbeter je opdracht",
        description:
          "Gebruik de aandachtspunten en de herschreven opdrachtbrief voor vervolg in het gesprek.",
      },
    ],
  },

  values: {
    subtitle: "Drie functies die direct helpen bij het beoordelen en verbeteren van je zzp-opdracht.",
    items: [
      {
        title: "Analyse van je opdrachtomschrijving",
        description:
          "DBA Kompas toetst je opdrachtomschrijving en brengt aandachtspunten overzichtelijk in beeld.",
      },
      {
        title: "Herschreven opdrachtbrief",
        description:
          "Op basis van je input genereert DBA Kompas een herschreven opdrachtbrief als werkdocument voor vervolg met opdrachtgever of intermediair.",
      },
      {
        title: "Nieuws & updates voor zzp'ers",
        description:
          "Volg relevante ontwikkelingen rond zzp-wetgeving, beleid en rechtspraak, zodat je sneller ziet wat invloed kan hebben op opdrachten.",
      },
    ],
  },

  audience: {
    title: "Relevant voor meerdere partijen rond de opdracht",
    supporting: "Primair voor zzp'ers, praktisch relevant in gesprekken met andere betrokken partijen.",
    blocks: [
      {
        heading: "Voor zzp'ers",
        text: "Zie eerder waar je opdrachtomschrijving vragen oproept en ga beter voorbereid het gesprek in.",
      },
      {
        heading: "Voor opdrachtgevers",
        text: "Krijg sneller zicht op waar een opdrachttekst scherper moet worden geformuleerd.",
      },
      {
        heading: "Voor intermediairs",
        text: "Gebruik de uitkomst als extra houvast in gesprekken over de inrichting en formulering van de opdracht.",
      },
    ],
  },

  trust: {
    subtitle:
      "Geen grote claims, wel duidelijke uitleg over de werking en de grenzen van de dienst.",
    items: [
      {
        title: "Indicatief",
        description:
          "De uitkomst is bedoeld als ondersteuning bij je eigen beoordeling en hangt af van de informatie die je invoert.",
      },
      {
        title: "Geen juridisch advies",
        description:
          "DBA Kompas ondersteunt je beoordeling, maar geeft geen juridisch advies.",
      },
      {
        title: "Privacy",
        description:
          "We gaan zorgvuldig om met je gegevens. Voor betalingen gebruiken we Stripe. Meer informatie vind je in het privacybeleid.",
      },
    ],
  },

  pricing: {
    badge: "Prijzen",
    title: "Één check of doorlopend toegang",
    subtitle: "Voor één opdracht of voor structureel gebruik van DBA Kompas.",
    disclaimer: "Prijzen excl. btw. Betaling verloopt via Stripe. Abonnementen worden automatisch verlengd en zijn opzegbaar via je account.",
    steeringText: "Twijfel je? Begin met de eenmalige check. Verwacht je dit jaar meer dan twee opdrachten te toetsen, dan ben je met een abonnement voordeliger uit en beweeg je automatisch mee met de wetgeving.",
    plans: [
      {
        name: "Eenmalige check",
        planKey: "one_time_dba",
        supporting: "Voor één opdracht die nu speelt.",
        price: "€9,95",
        period: "eenmalig",
        popular: false,
        oneTime: true,
        cta: "Kies eenmalige check",
        features: [
          "1 opdrachtomschrijving toetsen",
          "Heranalyse binnen dezelfde check",
          "Risico-indicatie en aandachtspunten",
          "Herschreven opdrachtbrief (Word-download)",
          "Toegang tot één analyse, niet tot de volledige app",
        ],
      },
      {
        name: "Maandelijks",
        planKey: "monthly",
        supporting: "Voor wie regelmatig nieuwe opdrachten heeft.",
        price: "€20",
        period: "/maand",
        popular: false,
        cta: "Kies maandelijks",
        features: [
          "Toegang tot alle DBA-checks die je nodig hebt",
          "Nieuws en updates rond zzp-wetgeving",
          "Eerdere analyses terugzien",
          "Maandelijks opzegbaar",
        ],
      },
      {
        name: "Jaarlijks",
        planKey: "yearly",
        supporting: "Voor wie structureel als zelfstandige werkt.",
        price: "€200",
        period: "/jaar",
        popular: true,
        popularBadge: "Voordeligst per maand",
        cta: "Kies jaarlijks",
        features: [
          "Alles uit maandelijks",
          "Beweegt automatisch mee met wijzigingen in de wetgeving",
          "Lager bedrag per maand omgerekend",
          "Geschikt voor structureel gebruik als zelfstandige",
        ],
      },
    ],
  },

  faq: {
    items: [
      {
        question: "Wat is DBA Kompas?",
        answer:
          "DBA Kompas is een AI-ondersteunde analysetool voor zzp'ers, freelancers, ondernemers en opdrachtgevers. Het toetst je opdrachtomschrijving aan bekende gezichtspunten, signaleert mogelijke risico's en geeft concrete verbeterpunten en tekstvoorstellen.",
      },
      {
        question: "Is DBA Kompas een juridisch advieskanaal?",
        answer:
          "Nee. DBA Kompas is een ondersteunend hulpmiddel en biedt geen juridisch of fiscaal advies. De uitkomsten zijn indicatief en ondersteunend - je beoordeelt en verifieert output altijd zelf. Voor bindende conclusies raden we aan een gespecialiseerde jurist te raadplegen.",
      },
      {
        question: "Hoe werkt de AI-analyse?",
        answer:
          "Je voert je opdrachtomschrijving in of uploadt een document. De AI toetst je tekst aan de bekende gezichtspunten voor de beoordeling van arbeidsrelaties en geeft per punt een indicatie met aandachtspunten, suggesties en conceptteksten.",
      },
      {
        question: "Voor wie is DBA Kompas bedoeld?",
        answer:
          "DBA Kompas is ontwikkeld voor zakelijk gebruik - door zelfstandigen, freelancers, ondernemers en opdrachtgevers die handelen in de uitoefening van hun beroep of bedrijf. Registratie is uitsluitend bedoeld voor zakelijke gebruikers.",
      },
      {
        question: "Hoe gaat DBA Kompas om met mijn gegevens?",
        answer:
          "Privacy nemen we serieus. Analysegegevens en geëxtraheerde tekst worden standaard maximaal 14 dagen bewaard. Originele uploads worden niet permanent opgeslagen. Betalingen verlopen via Stripe - wij verwerken zelf geen kaart- of bankgegevens. Meer informatie vind je in ons Privacy- en Cookiebeleid.",
      },
      {
        question: "Wat kost DBA Kompas?",
        answer:
          "Je kunt kiezen uit een eenmalige check (€9,95), een maandabonnement (€20/maand) of een jaarabonnement (€200/jaar). Prijzen zijn exclusief btw. Betaling verloopt via Stripe. Abonnementen worden automatisch verlengd en zijn opzegbaar via je account.",
      },
      {
        question: "Kan ik mijn abonnement opzeggen?",
        answer:
          "Ja. Een maandabonnement is opzegbaar tegen het einde van de lopende maandperiode. Een jaarabonnement is opzegbaar tegen het einde van de lopende jaarperiode. Opzeggen kan via de self-service beheerfunctie in de app of het klantportaal van Stripe.",
      },
      {
        question: "Hoe kan ik contact opnemen?",
        answer:
          "Je kunt ons bereiken via info@dbakompas.nl. We helpen je graag met vragen over de dienst, je account of je abonnement.",
      },
    ],
  },

  cta: {
    title: "Klaar om te starten?",
    subtitle:
      "Ontdek binnen enkele minuten de mogelijke aandachtspunten in je opdrachtomschrijving.",
    primary: "Start je gratis zelfscan",
    secondary: "Bekijk voorbeeld",
  },

  footer: {
    tagline:
      "Inzicht in mogelijke DBA-risico's voor zzp'ers.",
    product: {
      title: "Product",
      links: [
        { label: "Functies", href: "#features" },
        { label: "Prijzen", href: "#prijzen" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    legal: {
      title: "Juridisch",
      links: [
        { label: "Privacybeleid", href: "#" },
        { label: "Algemene voorwaarden", href: "#" },
        { label: "Cookiebeleid", href: "#" },
      ],
    },
    contact: {
      title: "Contact",
      email: "info@dbakompas.nl",
    },
    copyright: "DBA Kompas. Alle rechten voorbehouden.",
  },

  disclaimer:
    "DBA Kompas biedt een indicatieve analyse en vormt geen juridisch advies.",
};
