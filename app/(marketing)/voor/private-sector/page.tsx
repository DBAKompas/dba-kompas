import type { Metadata } from "next";
import { SegmentPage } from "@/components/marketing/segment/SegmentPage";

export const metadata: Metadata = {
  title: "Voor de private sector",
  description:
    "Toets je zzp-opdracht in de private sector. Voor kenniswerkers in IT, advies, projectmanagement, design, marketing en content.",
};

const SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "DBA-toetsing voor zzp-opdrachten in de private sector",
  description:
    "Indicatief hulpmiddel voor zzp-kenniswerkers in IT, advies, projectmanagement, design, marketing en content.",
  provider: {
    "@type": "Organization",
    name: "DBA Kompas",
    url: "https://dbakompas.nl",
  },
  areaServed: "NL",
};

export default function PrivateSectorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_SCHEMA) }}
      />
      <SegmentPage
        eyebrow="VOOR DE PRIVATE SECTOR"
        h1="Toets je opdracht in de private sector"
        heroSubtext="Voor zzp-kenniswerkers in bijvoorbeeld IT, advies, projectmanagement, design, marketing en content."
        segmentLabel="Private sector"
        verdiepingSlugs={["wet-dba", "deliveroo-criteria", "handhaving-2026"]}
        risicoThemas={[
          {
            title: "Afgekaderde opdracht of doorlopende rol?",
            body: "Een resultaatgerichte opdracht met een start en eindpunt is verdedigbaar. Doorlopend onderdeel zijn van een scrum-team of squad, met sprint-reviews en planning-poker, brengt je dichter bij werknemerschap dan bij ondernemerschap.",
          },
          {
            title: "Hoe lang ben je al bij dezelfde opdrachtgever?",
            body: "Meerjarige IT-trajecten via brokers zijn in veel sectoren gangbaar. De Belastingdienst kijkt naar de totale duur bij een opdrachtgever, niet naar afzonderlijke projecten of sprints. Doorschuiven binnen dezelfde organisatie telt mee.",
          },
          {
            title: "Resultaat of capaciteit?",
            body: "Wordt je gefactureerd op resultaat (deliverable, project, definition of done) of op uren? Capaciteit-inhuur, 'staffing', is risicovoller dan opdrachten met een concrete output.",
          },
          {
            title: "Meerdere opdrachtgevers tegelijkertijd?",
            body: "In de private sector is parallel werken voor meerdere klanten vaak makkelijker dan in publiek. Dat versterkt je positie als ondernemer. Een grote klant met fulltime inzet komt dichter bij werknemerschap, ook al staat het anders in het contract.",
          },
        ]}
        faqItems={[
          {
            question: "Telt parallel werken voor meerdere klanten als ondernemerschap?",
            answer:
              "Ja, dat is een sterke indicator van ondernemerschap. De Belastingdienst kijkt ook naar de kwaliteit ervan: eigen middelen, eigen risico, eigen werkwijze en hoe je je in het economisch verkeer gedraagt.",
          },
          {
            question: "Wat als ik via een broker of intermediair werk?",
            answer:
              "De feitelijke situatie telt, niet wie het contract afsluit. Een brokerconstructie verandert niets aan hoe je in de praktijk werkt voor de eindopdrachtgever.",
          },
          {
            question: "Geldt DBA-risico voor agile teams en scrum?",
            answer:
              "Inbedding in een vast team met sprintreviews en planning-meetings versterkt het risico. Een afgekaderde opdracht binnen of naast een agile team kan wel, als jouw rol resultaatgericht en onafhankelijk is.",
          },
        ]}
      />
    </>
  );
}
