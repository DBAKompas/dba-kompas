'use client'

import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/marketing/BrandLogo";
import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center"
            data-testid="legal-link-home"
          >
            <BrandLogo variant="flatDark" className="h-9 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors duration-200"
            data-testid="legal-link-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h1
          className="text-2xl md:text-3xl font-bold mb-10 text-foreground"
          data-testid="legal-page-title"
        >
          {title}
        </h1>

        <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-ul:my-3 prose-li:my-0.5">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} DBA Kompas. Alle rechten voorbehouden.
        </div>
      </footer>
    </div>
  );
}
