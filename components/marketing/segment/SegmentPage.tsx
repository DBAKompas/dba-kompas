import Link from "next/link";
import { SplitWords } from "@/components/marketing/SplitWords";
import { FaqAccordion } from "@/components/marketing/faq/FaqAccordion";
import { Breadcrumb } from "@/components/marketing/kennisbank/Breadcrumb";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/kennisbank/MarketingChrome";
import { LANDING } from "@/content/landing.nl";
import { KENNISBANK_PAGES } from "@/content/kennisbank";
import { SegmentAnimations } from "./SegmentAnimations";

type RisicoThema = { title: string; body: string };
type FaqItemInput = { question: string; answer: string };

export type SegmentPageProps = {
  eyebrow: string;
  h1: string;
  heroSubtext: string;
  segmentLabel: string; // "Publieke sector" of "Private sector"
  verdiepingSlugs: string[]; // 3 kennispagina-slugs
  risicoThemas: RisicoThema[];
  faqItems: FaqItemInput[];
};

const STAPPEN = [
  { num: "01", text: "Plak of upload je opdracht" },
  { num: "02", text: "Bekijk je risico-indicatie" },
  { num: "03", text: "Ga sterker het gesprek in" },
];

const FEATURES = [
  { title: "Risico-indicatie op drie kernpunten", body: "Per kernpunt van je opdracht zie je waar aandacht nodig is, met concrete uitleg per domein." },
  { title: "Concrete aandachtspunten", body: "Geen vaag advies, maar specifieke punten die je opdracht versterken of verzwakken." },
  { title: "Herschreven opdrachtbrief", body: "Direct beschikbaar in Word en PDF, klaar voor het gesprek met opdrachtgever of intermediair." },
];

export function SegmentPage({ eyebrow, h1, heroSubtext, segmentLabel, verdiepingSlugs, risicoThemas, faqItems }: SegmentPageProps) {
  const verdieping = verdiepingSlugs
    .map((slug) => KENNISBANK_PAGES.find((p) => p.slug === slug))
    .filter((p): p is (typeof KENNISBANK_PAGES)[number] => Boolean(p));

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <SegmentAnimations />

      <MarketingHeader />

      {/* ── 1. HERO ───── */}
      <section className="relative px-4 sm:px-6 py-14 md:py-28 max-w-5xl mx-auto w-full text-center">
        <div className="text-left">
          <Breadcrumb
            hideVisible
            items={[
              { label: "Home", href: "/" },
              { label: "Voor wie", href: "/#voor-wie" },
              { label: segmentLabel },
            ]}
          />
        </div>
        <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">{eyebrow}</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-6">
          <SplitWords text={h1} dataAttr="data-segment-word" />
        </h1>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-8">
          <SplitWords text={heroSubtext} dataAttr="data-segment-body" />
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/?action=zelfscan" className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-3 rounded-md hover:bg-accent/90 transition-colors min-w-[240px] justify-center">
            Start je gratis zelfscan
          </Link>
          <Link href="/?action=check" className="inline-flex items-center gap-2 border border-accent text-accent font-semibold px-6 py-3 rounded-md hover:bg-accent/8 transition-colors">
            Toets je opdracht voor €9,95
          </Link>
        </div>
      </section>

      {/* ── 2. RISICO-THEMA'S ───── */}
      <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-7xl mx-auto w-full section-divider">
        <div className="text-center mb-12 md:mb-14">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">WAAR JE OP LET</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-3">Vier aandachtspunten voor jouw opdracht</h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Wat de Belastingdienst en de Hoge Raad in jouw context vooral meewegen.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {risicoThemas.map((t, i) => (
            <div key={t.title} data-segment-card className="bg-card rounded-2xl p-6 md:p-7 ring-1 ring-foreground/10">
              <p className="text-2xl md:text-3xl font-bold text-accent leading-none mb-3">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{t.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2b. VERDIEPING ───── */}
      {verdieping.length > 0 && (
        <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-7xl mx-auto w-full section-divider">
          <div className="text-center mb-10">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">VERDIEPING</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">Lees meer over de wetgeving</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {verdieping.map((kp) => (
              <Link
                key={kp.slug}
                href={`/kennisbank/${kp.slug}`}
                className="group block bg-card rounded-2xl p-6 ring-1 ring-foreground/10 hover:ring-accent/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-accent mb-3">KENNISBANK</p>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{kp.h1}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{kp.shortDescription}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  Lees meer
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. HOE HET WERKT (compact) ───── */}
      <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-5xl mx-auto w-full section-divider">
        <div className="text-center mb-10">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">HOE HET WERKT</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">In drie stappen naar duidelijkheid</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {STAPPEN.map((s) => (
            <div key={s.num} data-segment-step className="flex items-center gap-3 bg-card rounded-xl p-4 ring-1 ring-foreground/10">
              <span className="text-xl font-bold text-accent leading-none">{s.num}</span>
              <span className="text-sm md:text-base font-medium text-foreground">{s.text}</span>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/over-dba-kompas" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors group">
            <span>Lees meer over de methodiek</span>
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── 4. WAT JE KRIJGT ───── */}
      <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-7xl mx-auto w-full section-divider">
        <div className="text-center mb-12">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">WAT JE KRIJGT</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">Direct bruikbaar resultaat na elke analyse</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} data-segment-card className="bg-card rounded-2xl p-6 md:p-7 ring-1 ring-foreground/10">
              <span className="block w-8 h-0.5 bg-accent mb-3" />
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. PRIJZEN ───── */}
      <section id="prijzen" className="relative px-4 sm:px-6 py-12 md:py-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 md:mb-12 max-w-xl mx-auto">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-3">{LANDING.pricing.badge}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{LANDING.pricing.title}</h2>
          <p className="text-muted-foreground">{LANDING.pricing.subtitle}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 items-stretch max-w-5xl mx-auto">
          {LANDING.pricing.plans.map((plan) => (
            <div
              key={plan.planKey}
              data-segment-card
              className={`relative flex flex-col rounded-2xl p-7 md:p-10 border ${
                plan.popular ? "bg-primary text-primary-foreground border-primary/30 shadow-lg" : "bg-card border-border/50"
              }`}
            >
              {plan.popular && "popularBadge" in plan && plan.popularBadge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="whitespace-nowrap px-4 py-1 rounded-full bg-accent text-xs font-bold text-white shadow-sm">{plan.popularBadge}</span>
                </div>
              )}
              <h3 className={`font-bold text-lg mb-1 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>{plan.name}</h3>
              {plan.supporting && (
                <p className={`text-sm mb-5 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.supporting}</p>
              )}
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-extrabold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className={`flex-shrink-0 mt-px opacity-40 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`} aria-hidden="true">·</span>
                    <span className={plan.popular ? "text-primary-foreground/85" : "text-muted-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/#prijzen"
                className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md font-semibold text-sm ${
                  plan.popular ? "bg-accent text-white hover:bg-accent/90" : "border border-accent text-accent hover:bg-accent/8"
                } transition-colors`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground/60 mt-8">{LANDING.pricing.disclaimer}</p>
      </section>

      {/* ── 6. FAQ ───── */}
      <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-7xl mx-auto w-full section-divider">
        <div className="text-center mb-12">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">VEELGESTELDE VRAGEN</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">Voor jouw sector</h2>
        </div>
        <FaqAccordion items={faqItems} />
      </section>

      {/* ── 7. SLOT-CTA ───── */}
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
            <Link href="/?action=zelfscan" className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-2xl hover:shadow-accent/40 transition-shadow duration-300">
              Start je gratis zelfscan
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
