import Link from "next/link";
import BrandLogo from "@/components/marketing/BrandLogo";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo variant="dark" className="h-9 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Functies</Link>
          <Link href="/#prijzen" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Prijzen</Link>
          <Link href="/kennisbank" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Kennisbank</Link>
          <Link href="/over-dba-kompas" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Over</Link>
          <Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">FAQ</Link>
          <Link href="/" className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-4 py-2 rounded-md text-sm hover:bg-accent/90 transition-colors">
            Start je gratis zelfscan
          </Link>
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
              <Link href="/#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Functies</Link>
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
