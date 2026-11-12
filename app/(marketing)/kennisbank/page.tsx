import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { KENNISBANK_INDEX, KENNISBANK_CATEGORIEEN } from "@/content/kennisbank";
import { Breadcrumb } from "@/components/marketing/kennisbank/Breadcrumb";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/kennisbank/MarketingChrome";

export const metadata: Metadata = pageMeta({
  title: "Kennisbank — Wet DBA en zzp-wetgeving",
  description:
    "Korte, gevalideerde uitleg over de regels rond zzp-werk: Wet DBA, schijnzelfstandigheid, Deliveroo-criteria, Zelfstandigenwet en handhaving in 2026.",
  path: "/kennisbank",
});

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
        <Breadcrumb hideVisible items={[{ label: "Home", href: "/" }, { label: "Kennisbank" }]} />
        <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">Kennisbank</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-6">
          Kennis over Wet DBA en zzp-wetgeving
        </h1>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          Korte, gevalideerde uitleg over de regels rond zzp-werk.
        </p>
      </section>

      <section className="px-4 sm:px-6 pb-16 md:pb-24 max-w-[1240px] mx-auto w-full space-y-16">
        {KENNISBANK_CATEGORIEEN.map((cat) => {
          const items = KENNISBANK_INDEX.filter((p) => p.categorie === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} id={cat.toLowerCase().replace(/\s+/g, "-")} className="grid gap-8 md:grid-cols-[220px_1fr] scroll-mt-24">
              <h2 className="text-base font-semibold text-accent pt-2">{cat}</h2>
              <div className="grid gap-x-10 sm:grid-cols-2">
                {items.map((p) => (
                  <Link key={p.slug} href={`/kennisbank/${p.slug}`} className="group block border-t border-foreground py-6 transition-transform hover:-translate-y-1">
                    <h3 className="text-2xl font-medium text-foreground group-hover:underline underline-offset-4 decoration-accent">{p.h1}</h3>
                    <p className="mt-2 text-base text-muted-foreground leading-relaxed">{p.shortDescription}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <MarketingFooter />
    </div>
  );
}
