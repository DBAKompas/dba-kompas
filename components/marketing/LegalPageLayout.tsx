'use client'

import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/marketing/BrandLogo";
import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header — zelfde stijl als landing page */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center" data-testid="legal-link-home">
            <BrandLogo variant="dark" className="h-9 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-200"
            data-testid="legal-link-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar home
          </Link>
        </div>
      </header>

      {/* Document header */}
      <div className="border-b border-border/30 bg-primary/3">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
            DBA Kompas — Juridische documenten
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="legal-page-title">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground/60 mt-3 font-medium">
              Laatste update: {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div
          className="
            text-[0.925rem] leading-relaxed text-muted-foreground
            [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground
            [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:pb-2
            [&_h2]:border-b [&_h2]:border-border/40
            [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground/80
            [&_h3]:mt-5 [&_h3]:mb-2
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_ul]:mb-4 [&_ul]:ml-0 [&_ul]:space-y-1.5 [&_ul]:list-none
            [&_ul_li]:relative [&_ul_li]:pl-4
            [&_ul_li]:before:content-['–'] [&_ul_li]:before:absolute [&_ul_li]:before:left-0
            [&_ul_li]:before:text-muted-foreground/40
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent
          "
        >
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <BrandLogo variant="dark" className="h-7 w-auto opacity-60" />
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground/60">
              <Link href="/algemene-voorwaarden" className="hover:text-foreground transition-colors">Algemene Voorwaarden</Link>
              <Link href="/privacy-en-cookiebeleid" className="hover:text-foreground transition-colors">Privacy & Cookies</Link>
              <Link href="/ai-data-use-notice" className="hover:text-foreground transition-colors">AI & Gegevensverwerking</Link>
            </nav>
          </div>
          <p className="text-xs text-muted-foreground/40 mt-5">
            © {new Date().getFullYear()} DBA Kompas. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
}
