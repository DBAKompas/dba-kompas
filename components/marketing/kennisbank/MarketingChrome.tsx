"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/marketing/BrandLogo";
import { useMarketingModals } from "@/lib/store/marketingModals";

const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://app.dbakompas.nl";

const NAV_ITEMS: Array<{ label: string; href: string; matchPrefix?: string }> = [
  { label: "Functies", href: "/#functies" },
  { label: "Prijzen", href: "/#prijzen" },
  { label: "Kennisbank", href: "/kennisbank", matchPrefix: "/kennisbank" },
  { label: "Over", href: "/over-dba-kompas", matchPrefix: "/over-dba-kompas" },
  { label: "FAQ", href: "/#faq" },
];

export function MarketingHeader() {
  const pathname = usePathname() || "/";
  const { openZelfscan } = useMarketingModals();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo variant="dark" className="h-9 w-auto" />
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
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={`${APP_URL}/login`}
            className="inline-flex items-center gap-2 border border-border text-foreground font-medium px-4 py-2 rounded-full text-sm hover:bg-foreground/5 transition-colors"
          >
            Ga naar de app
          </a>
          <button
            type="button"
            onClick={openZelfscan}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-full text-sm hover:bg-primary/90 transition-colors"
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
              <Link href="/#functies" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Functies</Link>
              <Link href="/#prijzen" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Prijzen</Link>
              <Link href="/kennisbank" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Kennisbank</Link>
              <Link href="/over-dba-kompas" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Over DBA Kompas</Link>
              <Link href="/#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Voor</p>
              <Link href="/voor/publieke-sector" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Publieke sector</Link>
              <Link href="/voor/private-sector" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Private sector</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Juridisch</p>
              <Link href="/algemene-voorwaarden" className="block text-sm text-muted-foreground hover:text-accent transition-colors">Algemene Voorwaarden</Link>
              <Link href="/privacy-en-cookiebeleid" className="block text-sm text-muted-foreground hover:text-accent transition-colors">Privacy &amp; Cookies</Link>
              <Link href="/ai-data-use-notice" className="block text-sm text-muted-foreground hover:text-accent transition-colors">AI &amp; Gegevensverwerking</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/50">
          <span>DBA Kompas. Alle rechten voorbehouden.</span>
          <span>DBA Kompas biedt een indicatieve analyse en vormt geen juridisch advies.</span>
        </div>
      </div>
    </footer>
  );
}
