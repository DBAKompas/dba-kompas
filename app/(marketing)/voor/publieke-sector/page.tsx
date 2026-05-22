import type { Metadata } from "next";
import { SegmentPage } from "@/components/marketing/segment/SegmentPage";

export const metadata: Metadata = {
  title: "Voor de publieke sector | DBA Kompas",
  description:
    "Toets je zzp-opdracht in de publieke sector. Voor kenniswerkers die werken voor ministeries, gemeenten, GGD, COA of provincies.",
};

const SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "DBA-toetsing voor zzp-opdrachten in de publieke sector",
  description:
    "Indicatief hulpmiddel voor zzp-kenniswerkers die werken voor ministeries, gemeenten, GGD, COA of provincies.",
  provider: {
    "@type": "Organization",
    name: "DBA Kompas",
    url: "https://dbakompas.nl",
  },
  areaServed: "NL",
};

export default function PubliekeSectorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_SCHEMA) }}
      />
      <SegmentPage
        eyebrow="VOOR DE PUBLIEKE SECTOR"
        h1="Toets je opdracht in de publieke sector"
        heroSubtext="Voor zzp-kenniswerkers die werken voor bijvoorbeeld ministeries, gemeenten, GGD, COA of provincies."
        segmentLabel="Publieke sector"
        verdiepingSlugs={["wet-dba", "schijnzelfstandigheid", "handhaving-2026"]}
        risicoThemas={[
          {
            title: "Afgekaderde opdracht of vaste positie?",
            body: "De Belastingdienst kijkt naar de feitelijke situatie. Een zzp-opdracht moet een duidelijk resultaat hebben met een start en een eindpunt, geen rol die meeloopt in de operatie. Een communicatieadviseur die een afgebakend communicatieplan herschrijft is verdedigbaar. Diezelfde adviseur die aanschuift bij vaste overleggen en wordt aangestuurd door de manager komt te dicht bij de lijnorganisatie.",
          },
          {
            title: "Hoe lang ben je al bij dezelfde opdrachtgever?",
            body: "De Belastingdienst kijkt naar de totale duur bij een opdrachtgever, niet naar afzonderlijke projecten. Doorschuiven naar een volgende opdracht binnen dezelfde organisatie telt mee. Veelgemaakte misvatting: 'het is een nieuw project, dus de teller begint opnieuw'. Dat klopt niet.",
          },
          {
            title: "Een opdrachtgever, lange relaties",
            body: "Intermediairs hebben er belang bij dat je lang op een opdracht blijft. Als ondernemer moet je je hiervan bewust zijn: weinig opdrachtgevers en lange relaties zetten je ondernemerschap onder druk in de ogen van de Belastingdienst.",
          },
          {
            title: "Aansturing in de praktijk",
            body: "Vaste overleggen, prestatiebeoordeling, terugkoppeling van een leidinggevende: feitelijk gezag, ook al staat het niet in het contract. Wat in praktijk gebeurt telt, niet wat op papier staat.",
          },
        ]}
        faqItems={[
          {
            question: "Geldt DBA-risico ook voor opdrachten via een raamovereenkomst?",
            answer:
              "Ja. De Belastingdienst kijkt naar de feitelijke situatie, niet naar het contracttype. Een raamovereenkomst of inkoopkanaal verandert niets aan hoe de arbeidsrelatie in de praktijk wordt vormgegeven.",
          },
          {
            question: "Wat betekent een goedgekeurde lopende modelovereenkomst voor mijn opdracht?",
            answer:
              "Goedgekeurde lopende modelovereenkomsten worden geëerbiedigd tot eind 2029. Belangrijk: de modelovereenkomst beschermt alleen als de feitelijke werkwijze er ook bij past.",
          },
          {
            question: "Hoe lang mag ik bij dezelfde opdrachtgever werken als zzp'er?",
            answer:
              "Geen vaste termijn. Maar hoe langer je bij dezelfde opdrachtgever zit, hoe meer aandacht voor inbedding, gezag en ondernemerschap. De Belastingdienst kijkt naar de totale duur bij die ene opdrachtgever, niet naar afzonderlijke projecten.",
          },
        ]}
      />
    </>
  );
}
