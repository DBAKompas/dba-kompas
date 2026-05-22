import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/components/marketing/BrandLogo";
import { SplitWords } from "@/components/marketing/SplitWords";
import { OverAnimations } from "@/components/marketing/over/OverAnimations";
import { Breadcrumb } from "@/components/marketing/kennisbank/Breadcrumb";

export const metadata: Metadata = {
  title: "Over DBA Kompas — Methodiek, maker en bronnen",
  description:
    "DBA Kompas is een indicatief hulpmiddel voor zzp-kenniswerkers, gemaakt door Marvin Zoetemelk op basis van Wet DBA en Hoge Raad-jurisprudentie. Lees over de methodiek en grenzen.",
};

const ABOUT_PAGE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Over DBA Kompas",
  description: "Methodiek, maker en bronnen van DBA Kompas.",
  mainEntity: {
    "@type": "Person",
    name: "Marvin Zoetemelk",
    jobTitle: "Maker DBA Kompas",
    email: "info@dbakompas.nl",
  },
};

const KERNPUNTEN = [
  {
    num: "1",
    title: "Aansturing en gezag",
    short: "Wie bepaalt hoe en wanneer je werkt.",
    long: "Hieronder vallen onder meer de aard en duur van de werkzaamheden, de wijze waarop werktijden worden bepaald, de mate van inbedding in de organisatie en of het werk persoonlijk moet worden uitgevoerd. Gezichtspunten 1 tot en met 4 uit het Deliveroo-arrest.",
  },
  {
    num: "2",
    title: "Eigen rekening en risico",
    short: "Wie draagt het risico en de kosten.",
    long: "Dit betreft de wijze waarop de beloning wordt bepaald en uitgekeerd, de hoogte ervan, en of de werkende commercieel risico loopt. Gezichtspunten 6 tot en met 8.",
  },
  {
    num: "3",
    title: "Ondernemerschap",
    short: "Of je je als ondernemer gedraagt.",
    long: "Of de werkende zich in het economisch verkeer als ondernemer gedraagt: meerdere opdrachtgevers, reputatie opbouwen, acquisitie, fiscale behandeling. Gezichtspunt 9.",
  },
];

const WEL = [
  { title: "Een indicatief hulpmiddel", body: "Bedoeld als ondersteuning bij je eigen beoordeling, niet als bindend oordeel." },
  { title: "Op basis van Wet DBA en jurisprudentie", body: "Onderhouden op actuele wetgeving, inclusief Hoge Raad-uitspraken." },
  { title: "Voor zzp-kenniswerkers", body: "Publieke en private sector, niet voor fysiek werk of aangenomen werk." },
  { title: "Snel en herhaalbaar", body: "Binnen een minuut een gestructureerde analyse, elke opdracht via dezelfde methode." },
];

const NIET = [
  { title: "Geen juridisch advies", body: "Vervangt geen jurist of fiscalist, en is dat ook niet bedoeld." },
  { title: "Geen bindend oordeel", body: "De uitkomst is een indicatie, geen formele beoordeling." },
  { title: "Geen garantie", body: "Garandeert geen specifieke uitkomst bij Belastingdienst of opdrachtgever." },
  { title: "Geen vervanging van professional", body: "Bij een complexe situatie of lopend geschil blijft een jurist verstandig." },
];

const BRONNEN = [
  { naam: "Belastingdienst", body: "Publicaties over handhaving, naheffingen, modelovereenkomsten en het Deliveroo-kader." },
  { naam: "Rijksoverheid", body: "Beleidsvoornemens, wetsvoorstellen rond zzp en arbeidsmarkt." },
  { naam: "Hoge Raad", body: "Jurisprudentie, in het bijzonder het Deliveroo-arrest en latere uitspraken." },
  { naam: "Tweede Kamer", body: "Wetsdossiers: Zelfstandigenwet (in voorbereiding), rechtsvermoeden bij laag uurtarief." },
];

export default function OverPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_PAGE_SCHEMA) }}
      />
      <OverAnimations />

      {/* ── HEADER ─────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo variant="dark" className="h-9 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Functies
            </Link>
            <Link href="/#prijzen" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Prijzen
            </Link>
            <Link href="/over-dba-kompas" className="text-sm text-foreground transition-colors font-semibold">
              Over
            </Link>
            <Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              FAQ
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-4 py-2 rounded-md text-sm hover:bg-accent/90 transition-colors"
            >
              Start je gratis zelfscan
            </Link>
          </nav>
        </div>
      </header>

      {/* ── SECTIE 1: HERO ──────────────────────── */}
      <section className="relative px-4 sm:px-6 py-14 md:py-28 max-w-5xl mx-auto w-full text-center">
        <div className="text-left">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Over" }]} />
        </div>
        <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">OVER DBA KOMPAS</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-6">
          <SplitWords text="Een vaste methodiek voor zzp-opdrachten, gemaakt vanuit de praktijk" dataAttr="data-over-hero-word" />
        </h1>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          <SplitWords
            text="DBA Kompas is ontstaan uit jarenlange praktijkervaring met opdrachtbeoordeling voor publieke en private organisaties. Het helpt zzp-kenniswerkers vooraf te zien waar hun opdracht vragen oproept rond de Wet DBA."
            dataAttr="data-over-hero-body"
          />
        </p>
      </section>

      {/* ── SECTIE 2: DE MAKER ──────────────────── */}
      <section className="rounded-3xl bg-primary text-primary-foreground py-14 md:py-20 px-6 md:px-12 max-w-7xl mx-auto my-12 mx-4 sm:mx-6 md:mx-auto">
        <div className="md:grid md:grid-cols-[auto_1fr] gap-10 items-center">
          <div className="flex justify-center mb-8 md:mb-0">
            <img
              src="/team/marvin-zoetemelk.jpg"
              alt="Marvin Zoetemelk"
              className="w-full max-w-[280px] md:w-[280px] rounded-2xl ring-1 ring-primary-foreground/10 object-cover"
            />
          </div>
          <div>
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">DE MAKER</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-primary-foreground mb-6">
              <SplitWords text="Gemaakt vanuit de praktijk" dataAttr="data-over-maker-word" />
            </h2>
            <div className="space-y-4 text-base md:text-lg leading-relaxed text-primary-foreground/80">
              <p>
                <SplitWords
                  text="DBA Kompas is ontwikkeld door Marvin Zoetemelk. Hij werkt sinds zes jaar met externe inhuur en heeft zich gespecialiseerd in opdrachtbeoordeling voor onder meer gemeenten, GGD, COA en provincies. In die rol leerde hij de Wet DBA en het werkveld rond zzp-opdrachten van binnenuit kennen."
                  dataAttr="data-over-maker-body"
                />
              </p>
              <p>
                <SplitWords
                  text="De aanhoudende discussies rond schijnzelfstandigheid, de hervatte handhaving sinds 2025 en de aankomende Zelfstandigenwet maakten duidelijk dat zzp'ers behoefte hebben aan een vaste, herhaalbare manier om hun opdrachten te toetsen. Zonder direct een jurist te hoeven inschakelen. Daaruit groeide DBA Kompas."
                  dataAttr="data-over-maker-body"
                />
              </p>
            </div>
            <p className="text-base text-primary-foreground/80 mt-6">
              Bereikbaar via{" "}
              <a href="mailto:info@dbakompas.nl" className="text-accent hover:underline">
                info@dbakompas.nl
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTIE 3: DE METHODIEK ──────────────── */}
      <section className="relative px-4 sm:px-6 py-14 md:py-28 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">DE METHODIEK</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">
            <SplitWords text="Elke opdracht via hetzelfde kader" dataAttr="data-over-methodiek-word" />
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 text-base md:text-lg leading-relaxed text-muted-foreground">
          <p>
            <SplitWords
              text="De methodiek van DBA Kompas is gebaseerd op de wettelijke definitie van een arbeidsovereenkomst, vastgelegd in de Wet DBA en artikel 7:610 BW, en de jurisprudentie van de Hoge Raad. In het bijzonder het Deliveroo-arrest uit 2023 vormt de basis voor de toetsing."
              dataAttr="data-over-methodiek-body"
            />
          </p>
          <p>
            <SplitWords
              text="Het Deliveroo-arrest benoemt negen gezichtspunten die de Hoge Raad meeweegt bij de beoordeling van arbeidsrelaties. Belangrijk: deze gezichtspunten worden in onderlinge samenhang bekeken en geen enkel punt is op zichzelf beslissend. Dat noemt men de holistische toets."
              dataAttr="data-over-methodiek-body"
            />
          </p>
          <p>
            <SplitWords
              text="DBA Kompas vertaalt deze negen gezichtspunten in drie kernthema's. Elke opdracht wordt langs deze drie kernpunten beoordeeld."
              dataAttr="data-over-methodiek-body"
            />
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12" data-over-circles>
          {KERNPUNTEN.map((kp) => (
            <div key={kp.num} className="text-center md:text-left">
              <div
                data-over-circle
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-white mx-auto md:mx-0 mb-4"
              >
                <span className="text-2xl font-bold">{kp.num}</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{kp.title}</h3>
              <p className="text-sm text-foreground/80 font-medium mb-3">{kp.short}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{kp.long}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-base text-muted-foreground leading-relaxed max-w-3xl mx-auto mt-12">
          Elke opdracht wordt via dit kader beoordeeld. Geen wisselende antwoorden, geen prompt-afhankelijkheid: hetzelfde stappenplan elke keer, onderhouden op basis van actuele wetgeving en jurisprudentie.
        </p>
      </section>

      {/* ── SECTIE 4: WAT HET WEL IS ────────────── */}
      <section className="rounded-3xl bg-card py-14 md:py-20 px-6 md:px-12 max-w-7xl my-12 mx-4 sm:mx-6 md:mx-auto ring-1 ring-foreground/5">
        <div className="md:grid md:grid-cols-2 gap-10">
          <div className="mb-8 md:mb-0">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">WAT HET WEL IS</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-4">Indicatief en concreet</h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              DBA Kompas levert wat een snelle, herhaalbare toets moet leveren: helder inzicht en concrete output.
            </p>
          </div>
          <ul className="space-y-5">
            {WEL.map((item) => (
              <li key={item.title} className="flex items-start gap-3" data-over-list-item>
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <circle cx="10" cy="10" r="9" />
                  <path d="M 6 10 L 9 13 L 14 7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SECTIE 5: WAT HET NIET IS ───────────── */}
      <section className="max-w-7xl py-14 md:py-20 px-6 md:px-12 my-12 mx-4 sm:mx-6 md:mx-auto">
        <div className="md:grid md:grid-cols-2 gap-10">
          <ul className="space-y-5 mb-8 md:mb-0 md:order-1">
            {NIET.map((item) => (
              <li key={item.title} className="flex items-start gap-3" data-over-list-item>
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-muted-foreground/60" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="6.5" y1="6.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="13.5" y1="6.5" x2="6.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="md:order-2">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">WAT HET NIET IS</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-4">Heldere grenzen</h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              De analyse helpt je je opdracht beter inrichten. Bij een lopend geschil of complexe casus is professioneel advies nodig.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTIE 6: BRONNEN ───────────────────── */}
      <section className="rounded-3xl bg-[#faf0e6] py-14 md:py-20 px-6 md:px-12 max-w-5xl my-12 mx-4 sm:mx-6 md:mx-auto text-center">
        <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">BRONNEN</p>
        <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-4">Onderhouden op actuele wet- en regelgeving</h2>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          DBA Kompas scant dagelijks publicaties en uitspraken. Dit zijn de bronnen die we volgen, in volgorde van directheid:
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-8 max-w-3xl mx-auto text-left" data-over-bron-grid>
          {BRONNEN.map((b) => (
            <div key={b.naam} data-over-bron-card className="bg-card rounded-xl p-5 ring-1 ring-foreground/10">
              <p className="font-semibold text-foreground mb-2">{b.naam}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>

        <p className="text-base text-muted-foreground mt-8">Verandert het kader, dan beweegt onze analyse mee.</p>
      </section>

      {/* ── SECTIE 7: SLOT-CTA ──────────────────── */}
      <section className="relative px-4 sm:px-6 py-14 md:py-32 max-w-7xl mx-auto w-full overflow-hidden">
        <div className="relative rounded-3xl bg-primary text-primary-foreground p-12 md:p-20 overflow-hidden">
          <div className="absolute inset-0 opacity-60 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary-foreground/10 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-5">STARTEN</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">Toets je opdracht voor je het gesprek aangaat</h2>
            <p className="text-base md:text-lg leading-relaxed text-primary-foreground/80 mb-8 max-w-xl">
              Plak je opdracht en zie binnen een minuut waar de aandachtspunten zitten, met een herschreven opdrachtbrief als werkdocument.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-2xl hover:shadow-accent/40 transition-shadow duration-300"
            >
              Start je gratis zelfscan
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="border-t border-border/40 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="space-y-2">
              <BrandLogo variant="dark" className="h-7 w-auto" />
              <p className="text-sm text-muted-foreground max-w-xs">Inzicht in mogelijke DBA-risico&apos;s voor zzp&apos;ers.</p>
            </div>
            <div className="flex flex-wrap gap-12">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Product</p>
                <Link href="/#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Functies</Link>
                <Link href="/#prijzen" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Prijzen</Link>
                <Link href="/over-dba-kompas" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Over DBA Kompas</Link>
                <Link href="/#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Juridisch</p>
                <Link href="/algemene-voorwaarden" className="block text-sm text-muted-foreground hover:text-accent transition-colors">Algemene Voorwaarden</Link>
                <Link href="/privacy-en-cookiebeleid" className="block text-sm text-muted-foreground hover:text-accent transition-colors">Privacy &amp; Cookies</Link>
                <Link href="/ai-data-use-notice" className="block text-sm text-muted-foreground hover:text-accent transition-colors">AI &amp; Gegevensverwerking</Link>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Contact</p>
                <a href="mailto:info@dbakompas.nl" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">info@dbakompas.nl</a>
                <p className="text-sm text-muted-foreground/60">KvK: 99964538</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/50">
            <span>DBA Kompas. Alle rechten voorbehouden.</span>
            <span>DBA Kompas biedt een indicatieve analyse en vormt geen juridisch advies.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
