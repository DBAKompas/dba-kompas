"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/marketing/BrandLogo";
import { useMarketingModals } from "@/lib/store/marketingModals";

const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://app.dbakompas.nl";

const NAV_ITEMS: Array<{ label: string; href: string; matchPrefix?: string }> = [
  { label: "Wat je krijgt", href: "/#functies" },
  { label: "Prijzen", href: "/#prijzen" },
  { label: "Kennisbank", href: "/kennisbank", matchPrefix: "/kennisbank" },
  { label: "Over", href: "/over-dba-kompas", matchPrefix: "/over-dba-kompas" },
];

export function MarketingHeader() {
  const pathname = usePathname() || "/";
  const { openZelfscan } = useMarketingModals();

  return (
    <header className="sticky top-0 z-40 bg-[#0b1d3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo variant="white" className="h-7 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPrefix
              ? pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`)
              : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors font-medium ${
                  isActive ? "text-white font-semibold" : "text-white/75 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={`${APP_URL}/login`}
            className="inline-flex items-center gap-2 border border-white/30 text-white font-medium px-4 py-2 rounded-full text-sm hover:bg-white/10 transition-colors"
          >
            Ga naar de app
          </a>
          <button
            type="button"
            onClick={openZelfscan}
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-2 rounded-full text-sm hover:bg-accent/90 transition-colors"
          >
            Start je gratis zelfscan
          </button>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-[#081629] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div className="space-y-2">
            <BrandLogo variant="white" className="h-6 w-auto" />
            <p className="text-sm text-[#a9b7cd] max-w-xs">Inzicht in mogelijke DBA-risico&apos;s voor zzp&apos;ers.</p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Product</p>
              <Link href="/#functies" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Functies</Link>
              <Link href="/#prijzen" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Prijzen</Link>
              <Link href="/kennisbank" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Kennisbank</Link>
              <Link href="/over-dba-kompas" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Over DBA Kompas</Link>
              <Link href="/#faq" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">FAQ</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Voor</p>
              <Link href="/voor/publieke-sector" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Publieke sector</Link>
              <Link href="/voor/private-sector" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Private sector</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Juridisch</p>
              <Link href="/algemene-voorwaarden" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Algemene Voorwaarden</Link>
              <Link href="/privacy-en-cookiebeleid" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Privacy &amp; Cookies</Link>
              <Link href="/ai-data-use-notice" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">AI &amp; Gegevensverwerking</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/45">
          <span>DBA Kompas. Alle rechten voorbehouden.</span>
          <span>DBA Kompas biedt een indicatieve analyse en vormt geen juridisch advies.</span>
        </div>
      </div>
    </footer>
  );
}
