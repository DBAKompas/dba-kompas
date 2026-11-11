'use client'

import { useState, useEffect } from "react";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/marketing/BrandLogo";
import { Button } from "@/components/ui/button";
import { LANDING } from "@/content/landing.nl";
import { AuthModal } from "@/components/marketing/AuthModals";
import { useMarketingModals } from "@/lib/store/marketingModals";
import { useMarketingAuth as useAuth } from "@/components/marketing/useMarketingAuth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { HomeV3 } from "@/components/marketing/home-v3/HomeV3";
import { trackLandingPageView, useScrollTracking } from '@/lib/dba-analytics'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") || "https://app.dbakompas.nl";

const ANSWER_BLOCK_TEXT = LANDING.answerBlock;

const SCHEMA_SOFTWARE_APPLICATION = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DBA Kompas",
  description:
    "Online hulpmiddel voor zzp'ers in Nederland om hun opdrachtomschrijving te toetsen op mogelijke aandachtspunten rond de Wet DBA.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://dbakompas.nl",
  offers: [
    {
      "@type": "Offer",
      name: "Eenmalige check",
      price: "9.95",
      priceCurrency: "EUR",
      description: "Voor één opdracht die nu speelt.",
    },
    {
      "@type": "Offer",
      name: "Maandelijks abonnement",
      price: "20.00",
      priceCurrency: "EUR",
      description: "Voor wie regelmatig nieuwe opdrachten heeft.",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "20.00",
        priceCurrency: "EUR",
        billingDuration: "P1M",
      },
    },
    {
      "@type": "Offer",
      name: "Jaarlijks abonnement",
      price: "200.00",
      priceCurrency: "EUR",
      description: "Voor wie structureel als zelfstandige werkt.",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "200.00",
        priceCurrency: "EUR",
        billingDuration: "P1Y",
      },
    },
  ],
};

const SCHEMA_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DBA Kompas",
  url: "https://dbakompas.nl",
  logo: "https://dbakompas.nl/logo-dark-v3.png",
  email: "info@dbakompas.nl",
  identifier: {
    "@type": "PropertyValue",
    propertyID: "KvK",
    value: "99964538",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@dbakompas.nl",
    contactType: "customer service",
    areaServed: "NL",
    availableLanguage: "Dutch",
  },
};

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function HomeClient() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | null>(null);
  const { openZelfscan, openCheck } = useMarketingModals();
  const setQuickScanOpen = (open: boolean) => {
    if (open) openZelfscan();
  };
  const setEmailCheckoutPlan = (plan: "monthly" | "yearly" | "one_time_dba" | null) => {
    if (plan) openCheck(plan);
  };


  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (window.scrollY > 20) setMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    trackLandingPageView()
    return useScrollTracking('landing')
  }, [])

  function handleLogout() {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      window.location.href = "/";
    });
  }


  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Wat is DBA Kompas?",
        acceptedAnswer: { "@type": "Answer", text: ANSWER_BLOCK_TEXT },
      },
      ...LANDING.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ],
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_SOFTWARE_APPLICATION) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORGANIZATION) }}
      />

      {/* ── HEADER ─────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#0b1d3a]/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo variant="white" className="h-8 w-auto" />
          </Link>

          {/* Hamburger - alleen mobiel */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  <X className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  <Menu className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#functies" className="text-sm text-white/75 hover:text-white transition-colors font-medium">Wat je krijgt</a>
            <a href="#voor-wie" className="text-sm text-white/75 hover:text-white transition-colors font-medium">Voor wie</a>
            <a href="#waarom" className="text-sm text-white/75 hover:text-white transition-colors font-medium">Waarom nu</a>
            <a href="#prijzen" className="text-sm text-white/75 hover:text-white transition-colors font-medium">{LANDING.nav.pricing}</a>
            <Link href="/kennisbank" className="text-sm text-white/75 hover:text-white transition-colors font-medium">Kennisbank</Link>
            <Link href="/over-dba-kompas" className="text-sm text-white/75 hover:text-white transition-colors font-medium">Over</Link>
            {user ? (
              <>
                <span className="hidden lg:block text-sm text-white/60">{user.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => window.location.href = `${APP_URL}/dashboard`}
                >
                  Ga naar de app
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white" aria-label="Uitloggen">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => window.location.href = `${APP_URL}/login`}
                  title="Heb je al een account? Log hier in."
                >
                  {LANDING.nav.login}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setQuickScanOpen(true)}
                  className="rounded-full bg-accent text-white hover:bg-accent/90"
                >
                  {LANDING.nav.tryNow}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBIEL MENU ────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu paneel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed top-[57px] inset-x-0 z-40 md:hidden bg-background/98 backdrop-blur-xl border-b border-border/50 shadow-xl"
            >
              <nav className="max-w-7xl mx-auto px-5 py-5 flex flex-col gap-1">

                {/* Nav-links */}
                {[
                  { href: "#functies", label: LANDING.nav.features },
                  { href: "#prijzen",  label: LANDING.nav.pricing },
                  { href: "/kennisbank", label: "Kennisbank" },
                  { href: "/over-dba-kompas", label: "Over" },
                  { href: "#faq",      label: LANDING.nav.faq },
                ].map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-foreground hover:bg-primary/6 transition-colors"
                  >
                    {label}
                  </a>
                ))}

                {/* Scheidingslijn */}
                <div className="my-2 border-t border-border/40" />

                {/* CTA knoppen */}
                {user ? (
                  <>
                    <Button
                      className="w-full justify-center text-base py-5"
                      onClick={() => { setMenuOpen(false); window.location.href = `${APP_URL}/dashboard`; }}
                    >
                      Ga naar de app
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-center mt-1"
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Uitloggen
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full justify-center text-base py-5 btn-magnetic"
                      onClick={() => { setMenuOpen(false); setQuickScanOpen(true); }}
                    >
                      {LANDING.nav.tryNow}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center mt-2"
                      onClick={() => { setMenuOpen(false); window.location.href = `${APP_URL}/login`; }}
                    >
                      {LANDING.nav.login}
                    </Button>
                  </>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <HomeV3 onZelfscan={() => setQuickScanOpen(true)} onCheck={(plan) => setEmailCheckoutPlan(plan)} />

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="bg-[#081629] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="space-y-2">
              <BrandLogo variant="white" className="h-7 w-auto" />
              <p className="text-sm text-[#a9b7cd] max-w-xs">{LANDING.footer.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-12">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">{LANDING.footer.product.title}</p>
                {LANDING.footer.product.links.map((l, i) => (
                  <a key={i} href={l.href} className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">{l.label}</a>
                ))}
                <Link href="/kennisbank" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Kennisbank</Link>
                <Link href="/over-dba-kompas" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Over DBA Kompas</Link>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Juridisch</p>
                <Link href="/algemene-voorwaarden" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Algemene Voorwaarden</Link>
                <Link href="/privacy-en-cookiebeleid" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">Privacy & Cookies</Link>
                <Link href="/ai-data-use-notice" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">AI & Gegevensverwerking</Link>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">{LANDING.footer.contact.title}</p>
                <a href="mailto:info@dbakompas.nl" className="block text-sm text-[#a9b7cd] hover:text-white transition-colors">{LANDING.footer.contact.email}</a>
                <p className="text-sm text-white/45">KvK: 99964538</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/45">
            <span>{LANDING.footer.copyright}</span>
            <span>{LANDING.disclaimer}</span>
          </div>
        </div>
      </footer>

      {/* ── MODALS (zelfscan + email-checkout in layout via MarketingModalsRoot) ── */}
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitch={() => setAuthModal(null)}
        />
      )}
    </div>
  );
}
