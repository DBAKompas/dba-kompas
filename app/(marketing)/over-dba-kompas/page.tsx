import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { OverV3 } from "@/components/marketing/over/OverV3";
import { Breadcrumb } from "@/components/marketing/kennisbank/Breadcrumb";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/kennisbank/MarketingChrome";

export const metadata: Metadata = pageMeta({
  title: "Over DBA Kompas — Methodiek, maker en bronnen",
  description:
    "DBA Kompas is een indicatief hulpmiddel voor zzp-kenniswerkers, gemaakt door Marvin Zoetemelk op basis van Wet DBA en Hoge Raad-jurisprudentie. Lees over de methodiek en grenzen.",
  path: "/over-dba-kompas",
});

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

export default function OverPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_PAGE_SCHEMA) }}
      />
      <MarketingHeader />
      <Breadcrumb hideVisible items={[{ label: "Home", href: "/" }, { label: "Over" }]} />
      <OverV3 />

      {/* ── FOOTER ─────────────────────────────── */}
      <MarketingFooter />
    </div>
  );
}
