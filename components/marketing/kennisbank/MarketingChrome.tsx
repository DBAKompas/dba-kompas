"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/marketing/BrandLogo";
import { useMarketingModals } from "@/lib/store/marketingModals";
import { useMarketingAuth } from "@/components/marketing/useMarketingAuth";
import { KENNISBANK_CATEGORIEEN, KENNISBANK_INDEX } from "@/content/kennisbank";

const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://app.dbakompas.nl";

type Menu = "kennisbank" | "voor" | null;

const linkCls = "text-[15px] font-medium text-[#0b1d3a]/75 hover:text-[#0b1d3a] transition-colors";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * De kop van alle sitepagina's, ook de homepage. Eén menu, zodat de navigatie
 * niet verandert als je van pagina wisselt. Kennisbank en Voor wie klappen uit.
 */
export function MarketingHeader() {
  const pathname = usePathname() || "/";
  // Nieuwe pagina = nieuwe kop: zo staan uitklapmenu's na navigatie altijd dicht.
  return <HeaderInner key={pathname} pathname={pathname} />;
}

function HeaderInner({ pathname }: { pathname: string }) {
  const { openZelfscan } = useMarketingModals();
  const { user } = useMarketingAuth();
  const [menu, setMenu] = useState<Menu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Sluit alles bij Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hoverOpen = (m: Menu) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setMenu(m);
  };
  const hoverClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenu(null), 160);
  };

  const isKennisbank = pathname.startsWith("/kennisbank");
  const isVoor = pathname.startsWith("/voor");
  const appHref = user ? `${APP_URL}/dashboard` : `${APP_URL}/login`;
  const appLabel = user ? "Ga naar de app" : "Inloggen";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-7 h-[68px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="DBA Kompas, naar de homepage">
          <BrandLogo variant="dark" className="h-9 w-auto" />
        </Link>

        {/* Desktop */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Hoofdmenu">
          <Link href="/#functies" className={linkCls}>Wat je krijgt</Link>

          <div className="relative" onMouseEnter={() => hoverOpen("voor")} onMouseLeave={hoverClose}>
            <button
              type="button"
              className={`${linkCls} inline-flex items-center gap-1.5 ${isVoor ? "!text-[#0b1d3a] font-semibold" : ""}`}
              aria-expanded={menu === "voor"}
              onClick={() => setMenu(menu === "voor" ? null : "voor")}
            >
              Voor wie <Chevron open={menu === "voor"} />
            </button>
            {menu === "voor" && (
              <div className="absolute left-1/2 top-full -translate-x-1/2 pt-4">
                <div className="w-[300px] rounded-[22px] bg-white p-3 shadow-[0_30px_70px_-30px_rgba(11,29,58,0.45)] ring-1 ring-black/5">
                  <Link href="/voor/publieke-sector" className="block rounded-[14px] px-4 py-3 hover:bg-[#f4f2ee]">
                    <span className="block font-semibold text-[#0b1d3a]">Publieke sector</span>
                    <span className="block text-sm text-[#5d6b80]">Ministeries, gemeenten en uitvoeringsorganisaties</span>
                  </Link>
                  <Link href="/voor/private-sector" className="block rounded-[14px] px-4 py-3 hover:bg-[#f4f2ee]">
                    <span className="block font-semibold text-[#0b1d3a]">Private sector</span>
                    <span className="block text-sm text-[#5d6b80]">IT, advies, projectmanagement, design en marketing</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative" onMouseEnter={() => hoverOpen("kennisbank")} onMouseLeave={hoverClose}>
            <button
              type="button"
              className={`${linkCls} inline-flex items-center gap-1.5 ${isKennisbank ? "!text-[#0b1d3a] font-semibold" : ""}`}
              aria-expanded={menu === "kennisbank"}
              onClick={() => setMenu(menu === "kennisbank" ? null : "kennisbank")}
            >
              Kennisbank <Chevron open={menu === "kennisbank"} />
            </button>
            {menu === "kennisbank" && (
              <div className="absolute left-1/2 top-full -translate-x-1/2 pt-4">
                <div className="w-[720px] rounded-[26px] bg-white p-7 shadow-[0_30px_70px_-30px_rgba(11,29,58,0.45)] ring-1 ring-black/5">
                  <div className="grid grid-cols-2 gap-x-10 gap-y-7">
                    {KENNISBANK_CATEGORIEEN.map((cat) => {
                      const items = KENNISBANK_INDEX.filter((p) => p.categorie === cat);
                      if (items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <p className="mb-2 text-sm font-semibold text-[#d4782a]">{cat}</p>
                          {items.map((p) => (
                            <Link key={p.slug} href={`/kennisbank/${p.slug}`} className="block rounded-[12px] px-3 py-2 -mx-3 text-[15px] font-medium text-[#0b1d3a] hover:bg-[#f4f2ee]">
                              {p.h1}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/kennisbank" className="mt-6 inline-block border-t border-black/10 pt-5 text-sm font-semibold text-[#0b1d3a] underline underline-offset-4 decoration-[#d4782a] w-full">
                    Alle artikelen in de kennisbank
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link href="/#prijzen" className={linkCls}>Prijzen</Link>
          <Link href="/over-dba-kompas" className={`${linkCls} ${pathname.startsWith("/over-dba-kompas") ? "!text-[#0b1d3a] font-semibold" : ""}`}>Over</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href={appHref} className="inline-flex items-center rounded-full border border-[#0b1d3a]/25 px-4 py-2 text-sm font-medium text-[#0b1d3a] hover:bg-[#0b1d3a]/5 transition-colors">
            {appLabel}
          </a>
          <button type="button" onClick={openZelfscan} className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
            Start je gratis zelfscan
          </button>
        </div>

        {/* Mobiel */}
        <button
          type="button"
          className="lg:hidden flex size-10 items-center justify-center rounded-full text-[#0b1d3a] hover:bg-[#0b1d3a]/5"
          aria-label={mobileOpen ? "Menu sluiten" : "Menu openen"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {mobileOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-black/5 bg-white max-h-[calc(100vh-68px)] overflow-y-auto">
          <nav className="px-5 py-5 space-y-1" aria-label="Mobiel menu">
            <Link href="/#functies" className="block rounded-[12px] px-3 py-3 text-lg font-medium text-[#0b1d3a]">Wat je krijgt</Link>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-[12px] px-3 py-3 text-lg font-medium text-[#0b1d3a]">
                Voor wie <Chevron open={false} />
              </summary>
              <div className="pb-2 pl-3">
                <Link href="/voor/publieke-sector" className="block px-3 py-2 text-[#0b1d3a]/80">Publieke sector</Link>
                <Link href="/voor/private-sector" className="block px-3 py-2 text-[#0b1d3a]/80">Private sector</Link>
              </div>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-[12px] px-3 py-3 text-lg font-medium text-[#0b1d3a]">
                Kennisbank <Chevron open={false} />
              </summary>
              <div className="pb-2 pl-3">
                {KENNISBANK_CATEGORIEEN.map((cat) => {
                  const items = KENNISBANK_INDEX.filter((p) => p.categorie === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="mb-2">
                      <p className="px-3 pt-2 text-sm font-semibold text-[#d4782a]">{cat}</p>
                      {items.map((p) => (
                        <Link key={p.slug} href={`/kennisbank/${p.slug}`} className="block px-3 py-2 text-[#0b1d3a]/80">{p.h1}</Link>
                      ))}
                    </div>
                  );
                })}
                <Link href="/kennisbank" className="block px-3 py-2 font-semibold text-[#0b1d3a] underline underline-offset-4 decoration-[#d4782a]">Alle artikelen</Link>
              </div>
            </details>
            <Link href="/#prijzen" className="block rounded-[12px] px-3 py-3 text-lg font-medium text-[#0b1d3a]">Prijzen</Link>
            <Link href="/over-dba-kompas" className="block rounded-[12px] px-3 py-3 text-lg font-medium text-[#0b1d3a]">Over</Link>
            <div className="grid gap-2 pt-4">
              <a href={appHref} className="inline-flex items-center justify-center rounded-full border border-[#0b1d3a]/25 px-5 py-3 font-medium text-[#0b1d3a]">{appLabel}</a>
              <button type="button" onClick={() => { setMobileOpen(false); openZelfscan(); }} className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 font-semibold text-white">
                Start je gratis zelfscan
              </button>
            </div>
          </nav>
        </div>
      )}
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
              <Link href="/#functies" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Wat je krijgt</Link>
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
