import type { Metadata } from "next";
import Link from "next/link";
import { KENNISBANK_INDEX } from "@/content/kennisbank";
import { Breadcrumb } from "@/components/marketing/kennisbank/Breadcrumb";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/kennisbank/MarketingChrome";

export const metadata: Metadata = {
  title: "Kennisbank — Wet DBA en zzp-wetgeving | DBA Kompas",
  description:
    "Korte, gevalideerde uitleg over de regels rond zzp-werk: Wet DBA, schijnzelfstandigheid, Deliveroo-criteria, Zelfstandigenwet en handhaving in 2026.",
};

const COLLECTION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Kennisbank DBA Kompas",
  description: "Kennispagina's over Wet DBA en zzp-wetgeving.",
  url: "https://dbakompas.nl/kennisbank",
};

export default function KennisbankIndexPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_SCHEMA) }} />
      <MarketingHeader />

      <section className="relative px-4 sm:px-6 py-14 md:py-28 max-w-5xl mx-auto w-full text-center">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Kennisbank" }]} />
        <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">KENNISBANK</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-6">
          Kennis over Wet DBA en zzp-wetgeving
        </h1>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          Korte, gevalideerde uitleg over de regels rond zzp-werk.
        </p>
      </section>

      <section className="px-4 sm:px-6 pb-16 md:pb-24 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {KENNISBANK_INDEX.map((p) => (
            <Link
              key={p.slug}
              href={`/kennisbank/${p.slug}`}
              className="group relative block bg-card rounded-2xl p-6 md:p-7 ring-1 ring-foreground/10 hover:ring-accent/40 hover:-translate-y-1 transition-all duration-300"
            >
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-accent mb-3">KENNISBANK</p>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">{p.h1}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-5">{p.shortDescription}</p>
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

      <MarketingFooter />
    </div>
  );
}
