import Link from "next/link";
import { SplitWords } from "@/components/marketing/SplitWords";
import { FaqAccordion } from "@/components/marketing/faq/FaqAccordion";
import { KennisbankAnimations } from "./KennisbankAnimations";
import { Breadcrumb } from "./Breadcrumb";
import { MarketingHeader, MarketingFooter } from "./MarketingChrome";
import { KENNISBANK_PAGES, type KennisbankPage as KennisbankPageType } from "@/content/kennisbank";

export function KennisbankPage({ page }: { page: KennisbankPageType }) {
  const related = page.relatedSlugs
    .map((slug) => KENNISBANK_PAGES.find((p) => p.slug === slug))
    .filter((p): p is KennisbankPageType => Boolean(p));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: page.h1,
        acceptedAnswer: { "@type": "Answer", text: page.answerBlock },
      },
      ...page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.answerBlock,
    dateModified: "2026-05-22",
    datePublished: "2026-05-22",
    author: { "@type": "Organization", name: "DBA Kompas" },
    publisher: { "@type": "Organization", name: "DBA Kompas", url: "https://dbakompas.nl" },
    mainEntityOfPage: `https://dbakompas.nl/kennisbank/${page.slug}`,
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <KennisbankAnimations />
      <MarketingHeader />

      {/* Hero */}
      <section className="px-4 sm:px-6 py-12 md:py-16 max-w-3xl mx-auto w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Kennisbank", href: "/kennisbank" },
            { label: page.h1 },
          ]}
        />
        <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">KENNISBANK</p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground mb-4">
          <SplitWords text={page.h1} dataAttr="data-kennisbank-word" />
        </h1>
        <p className="text-sm text-muted-foreground">Laatst bijgewerkt: {page.laatstBijgewerkt}</p>
      </section>

      {/* Answer block */}
      <section className="px-4 sm:px-6 max-w-3xl mx-auto w-full mb-10 md:mb-14">
        <div className="border-l-4 border-accent bg-card pl-6 pr-6 py-6 rounded-r-xl">
          <p className="text-xs uppercase tracking-wider font-semibold text-accent mb-2">Het korte antwoord</p>
          <p className="text-base md:text-lg leading-relaxed text-foreground">{page.answerBlock}</p>
        </div>
      </section>

      {/* Body sections */}
      <article className="px-4 sm:px-6 py-6 md:py-10 max-w-3xl mx-auto w-full space-y-10">
        {page.sections.map((s, i) => (
          <div key={i} data-kennisbank-section>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground mb-4">{s.h2}</h2>
            {s.body.split(/\n\n+/).map((para, j) => (
              <p key={j} className="text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-line mb-4 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        ))}
      </article>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-12 md:py-16 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-3">VEELGESTELDE VRAGEN</p>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">Vragen rond dit onderwerp</h2>
        </div>
        <FaqAccordion items={page.faq} />
      </section>

      {/* Related links */}
      {related.length > 0 && (
        <section className="px-4 sm:px-6 py-12 md:py-16 max-w-5xl mx-auto w-full">
          <div className="mb-8 text-center">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-3">VERDER LEZEN</p>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">Gerelateerde kennisbank-pagina&apos;s</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/kennisbank/${r.slug}`}
                data-kennisbank-related
                className="group block bg-card rounded-2xl p-6 ring-1 ring-foreground/10 hover:ring-accent/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{r.h1}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{r.shortDescription}</p>
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

      {/* Voor wie geldt dit? */}
      <section className="px-4 sm:px-6 py-10 md:py-14 max-w-5xl mx-auto w-full">
        <div className="mb-6 text-center">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-3">VOOR WIE GELDT DIT?</p>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">Bekijk de risico-thema&apos;s voor jouw sector</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <Link href="/voor/publieke-sector" className="group block bg-card rounded-2xl p-6 ring-1 ring-foreground/10 hover:ring-accent/40 hover:-translate-y-0.5 transition-all duration-300">
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Werk je in de publieke sector?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">Bekijk de risico-thema&apos;s voor zzp-kenniswerkers in ministeries, gemeenten, GGD, COA en provincies.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              Voor publieke sector
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
          <Link href="/voor/private-sector" className="group block bg-card rounded-2xl p-6 ring-1 ring-foreground/10 hover:ring-accent/40 hover:-translate-y-0.5 transition-all duration-300">
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Werk je in de private sector?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">Bekijk de risico-thema&apos;s voor zzp-kenniswerkers in IT, advies, projectmanagement, design, marketing en content.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              Voor private sector
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      </section>

      {/* Conversie-CTA */}
      <section className="relative px-4 sm:px-6 py-14 md:py-24 max-w-7xl mx-auto w-full overflow-hidden">
        <div className="relative rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 overflow-hidden text-center">
          <div className="absolute inset-0 opacity-50 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">STARTEN</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">Toets je opdracht zelf</h2>
            <p className="text-base md:text-lg text-primary-foreground/80 mb-8">
              Met DBA Kompas toets je je opdracht in 60 seconden. Direct een indicatie en concrete aandachtspunten.
            </p>
            <Link href="/?action=zelfscan" className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-7 py-3.5 rounded-full shadow-lg hover:shadow-2xl hover:shadow-accent/40 transition-shadow duration-300">
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
