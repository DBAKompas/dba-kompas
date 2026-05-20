'use client'

import { useState, useEffect } from "react";
import {
  ArrowRight, LogOut, Zap, ChevronDown, Menu, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/marketing/BrandLogo";
import { Button } from "@/components/ui/button";
import { LANDING } from "@/content/landing.nl";
import { AuthModal } from "@/components/marketing/AuthModals";
import { EmailCheckoutModal } from "@/components/marketing/EmailCheckoutModal";
import QuickScanModal from "@/components/marketing/QuickScanModal";
import { HeroAnimations } from "@/components/marketing/HeroAnimations";
import { SplitWords } from "@/components/marketing/SplitWords";
import { AnswerBlockAnimations } from "@/components/marketing/AnswerBlockAnimations";
import { InzetIllustration } from "@/components/marketing/InzetIllustration";
import { InzetAnimations } from "@/components/marketing/InzetAnimations";
import { HowItWorksCarousel } from "@/components/marketing/HowItWorksCarousel";
import { NieuwsIllustration } from "@/components/marketing/news/NieuwsIllustration";
import { NieuwsAnimations } from "@/components/marketing/news/NieuwsAnimations";
import { ChatGptAnimations } from "@/components/marketing/ChatGptAnimations";
import { SlotAnimations } from "@/components/marketing/SlotAnimations";
import { RisicoVisual } from "@/components/marketing/features/RisicoVisual";
import { AandachtspuntenVisual } from "@/components/marketing/features/AandachtspuntenVisual";
import { OpdrachtbriefVisual } from "@/components/marketing/features/OpdrachtbriefVisual";
import { FeaturesAnimations } from "@/components/marketing/features/FeaturesAnimations";
import { CompassDecoration } from "@/components/marketing/CompassDecoration";
import { AppDemoHero } from "@/components/marketing/AppDemoHero";
import { useMarketingAuth as useAuth } from "@/components/marketing/useMarketingAuth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { viewportConfig } from "@/lib/motion";
import { trackLandingPageView, useScrollTracking } from '@/lib/dba-analytics'
import { trackFaqOpened } from '@/lib/dba-analytics'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") || "https://app.dbakompas.nl";

const ANSWER_BLOCK_TEXT =
  "DBA Kompas is een online hulpmiddel voor zzp'ers in Nederland. Je voert je opdrachtomschrijving in en krijgt binnen ongeveer een minuut een indicatie van mogelijke aandachtspunten rond de Wet DBA, samen met een herschreven opdrachtbrief. De analyse volgt een vaste methodiek die wordt onderhouden op basis van de actuele wetgeving. De uitkomst is indicatief en ondersteunt je eigen beoordeling. Het is geen juridisch advies.";

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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-foreground hover:bg-primary/4 transition-colors"
        onClick={() => {
          if (!open) trackFaqOpened(question, 'landing')
          setOpen(!open)
        }}
      >
        <span>{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-5 text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | null>(null);
  const [emailCheckoutPlan, setEmailCheckoutPlan] = useState<"monthly" | "yearly" | "one_time_dba" | null>(null);
  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [mockupHovered, setMockupHovered] = useState(false);

  function scrollToPricing() {
    trackPricingViewed('landing')
    document.getElementById("prijzen")?.scrollIntoView({ behavior: "smooth" });
  }

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
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo variant="dark" className="h-9 w-auto" />
          </Link>

          {/* Hamburger - alleen mobiel */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-foreground hover:bg-primary/8 transition-colors"
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
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {LANDING.nav.features}
            </a>
            <a href="#prijzen" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {LANDING.nav.pricing}
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {LANDING.nav.faq}
            </a>
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-muted-foreground">{user.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `${APP_URL}/dashboard`}
                >
                  Ga naar de app
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `${APP_URL}/login`}
                  title="Heb je al een account? Log hier in."
                >
                  {LANDING.nav.login}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setQuickScanOpen(true)}
                  className="btn-magnetic"
                >
                  {LANDING.nav.tryNow}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
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
                  { href: "#features", label: LANDING.nav.features },
                  { href: "#prijzen",  label: LANDING.nav.pricing },
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

      {/* ── HERO ───────────────────────────────── */}
      <section className="relative overflow-x-hidden hero-gradient hero-shimmer px-4 sm:px-6 pt-20 pb-10 md:pt-28 md:pb-14 max-w-7xl mx-auto w-full">
        <HeroAnimations />
        <div
          className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
          data-hero-bg
        >
          <div className="bg-mesh-a absolute -top-1/2 left-1/2 -translate-x-1/2 w-[120%] h-[200%] bg-[radial-gradient(circle_at_30%_40%,_rgba(212,120,42,0.10),_transparent_60%)]" />
          <div className="bg-mesh-b absolute top-1/3 left-1/2 -translate-x-1/2 w-[110%] h-[150%] bg-[radial-gradient(circle_at_70%_60%,_rgba(11,29,58,0.07),_transparent_55%)]" />
        </div>
        <CompassDecoration />

        <div className="grid md:grid-cols-[55fr_45fr] gap-8 lg:gap-12 items-center">
          {/* Linker kolom: tekst + CTA's */}
          <div className="text-center md:text-left space-y-6">
            <p data-hero-eyebrow className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-3">VOOR ZZP&apos;ERS</p>

            <h1
              data-hero-h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground"
            >
              {LANDING.hero.title.split(" ").map((w, i) => (
                <span key={`t${i}`} className="inline-block">{w}&nbsp;</span>
              ))}
              {LANDING.hero.titleHighlight.split(" ").map((w, i, arr) => (
                <span key={`h${i}`} className="inline-block text-primary">
                  {w}{i < arr.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>

            <p
              data-hero-subhead
              className="text-lg md:text-xl text-muted-foreground max-w-2xl md:mx-0 mx-auto leading-relaxed"
            >
              {LANDING.hero.subtitle}
            </p>

            <div
              data-hero-cta
              className="flex flex-col sm:flex-row items-center md:justify-start justify-center gap-3 pt-2"
            >
              <Button
                size="lg"
                onClick={() => setQuickScanOpen(true)}
                className="btn-magnetic min-w-[240px] bg-accent text-white hover:bg-accent/90 border-0"
              >
                <Zap className="w-4 h-4 mr-2 flex-shrink-0" />
                {LANDING.hero.ctaPrimary}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setEmailCheckoutPlan("one_time_dba")}
                className="border-accent text-accent hover:bg-accent/8 hover:text-accent"
              >
                {LANDING.hero.ctaSecondary}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground/70 pt-1">
              {LANDING.hero.supporting}
            </p>
          </div>

          {/* Rechter kolom: dual-sided screen met levende mini-app demo */}
          <div className="relative w-full max-w-[640px] mx-auto md:mx-0 md:ml-auto">
            {/* Soft glow achter scherm */}
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-accent/10 via-transparent to-primary/10 blur-3xl" />

            {/* 3D stage */}
            <div
              data-hero-mockup
              data-laptop-stage
              onMouseEnter={() => setMockupHovered(true)}
              onMouseLeave={() => setMockupHovered(false)}
              className="relative z-10 w-full"
              style={{ perspective: "1600px" }}
            >
              {/* Flipper: dual-sided card */}
              <div
                data-screen-flipper
                className="relative aspect-[16/10] w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* VOORKANT: demo */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden bg-card shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/10"
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                >
                  <AppDemoHero paused={mockupHovered} startDelayMs={1700} />
                  {/* Glas-reflectie overlay */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                  {/* LIVE-indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-border/50 z-30">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-foreground">Live analyse</span>
                  </div>
                </div>

                {/* ACHTERKANT: blanco met licht logo */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#f5f3ee] via-[#ebe9e3] to-[#dcd9d2] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/10 flex items-center justify-center"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <img
                    src="/logo-dark-v3.png"
                    alt=""
                    className="w-1/3 max-w-[180px] opacity-[0.12]"
                  />
                </div>
              </div>

              {/* Gerichte drop-shadow onder scherm */}
              <div className="pointer-events-none absolute inset-x-12 -bottom-6 h-8 bg-foreground/15 blur-xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── ANSWER BLOCK ───────────────────────── */}
      <section className="relative px-4 sm:px-6 py-20 md:py-28 max-w-7xl mx-auto w-full">
        <AnswerBlockAnimations />
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* LINKS: tekst */}
          <div data-answer-text>
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">ANTWOORD</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-6">
              <SplitWords text="Wat is DBA Kompas?" dataAttr="data-answer-word" />
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              <SplitWords text={ANSWER_BLOCK_TEXT} dataAttr="data-answer-word-body" />
            </p>
          </div>

          {/* RECHTS: 2x2 stat-grid */}
          <div className="grid grid-cols-2 gap-4" data-answer-stats>
            <div className="relative bg-[#faf0e6] rounded-2xl p-6 md:p-8 ring-1 ring-accent/15 overflow-hidden">
              <p className="text-4xl md:text-5xl font-bold text-accent leading-none mb-3">60 sec</p>
              <p className="text-sm text-foreground/80 font-medium">Doorlooptijd analyse</p>
            </div>
            <div className="relative bg-[#faf0e6] rounded-2xl p-6 md:p-8 ring-1 ring-accent/15 overflow-hidden">
              <p className="text-4xl md:text-5xl font-bold text-accent leading-none mb-3">9</p>
              <p className="text-sm text-foreground/80 font-medium">Deliveroo-criteria Hoge Raad</p>
            </div>
            <div className="relative bg-[#faf0e6] rounded-2xl p-6 md:p-8 ring-1 ring-accent/15 overflow-hidden">
              <p className="text-4xl md:text-5xl font-bold text-accent leading-none mb-3">3</p>
              <p className="text-sm text-foreground/80 font-medium">Kernpunten in elke analyse</p>
            </div>
            <div className="relative bg-[#faf0e6] rounded-2xl p-6 md:p-8 ring-1 ring-accent/15 overflow-hidden">
              <p className="text-3xl md:text-4xl font-bold text-accent leading-none mb-3">Word + PDF</p>
              <p className="text-sm text-foreground/80 font-medium">Herschreven opdrachtbrief</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INZET ──────────────────────────────── */}
      <section className="relative px-4 sm:px-6 py-20 md:py-28 max-w-7xl mx-auto w-full overflow-hidden section-divider">
        <InzetAnimations />
        <div className="grid md:grid-cols-[6fr_5fr] gap-12 md:gap-16 items-center">
          {/* LINKS: tekst */}
          <div data-inzet-text>
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">WAAROM HET ER NU TOE DOET</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-6">
              <SplitWords text="Je opdracht is je inkomen" dataAttr="data-inzet-word" />
            </h2>
            <div className="space-y-4 text-base md:text-lg leading-relaxed text-muted-foreground">
              <p>
                <SplitWords
                  text="Als de manier waarop je opdracht is ingericht vragen oproept over zelfstandigheid, kan dat gevolgen hebben: een opdrachtgever die de opdracht wil herzien, een intermediair die om extra stukken vraagt, of een opdracht die niet wordt verlengd. Sinds 2025 handhaaft de Belastingdienst weer op schijnzelfstandigheid, en opdrachtgevers zijn daardoor voorzichtiger geworden. Dat raakt jou direct."
                  dataAttr="data-inzet-word-body"
                />
              </p>
              <p>
                <SplitWords
                  text="DBA Kompas laat je vooraf zien waar je opdrachtomschrijving die vragen oproept, zodat je niet voor verrassingen komt te staan."
                  dataAttr="data-inzet-word-body"
                />
              </p>
            </div>
          </div>

          {/* RECHTS: SVG-illustratie + decoraties */}
          <div className="relative" data-inzet-visual>
            <InzetIllustration />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section className="relative px-4 sm:px-6 py-20 md:py-28 max-w-7xl mx-auto w-full section-divider">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">HOE HET WERKT</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-4">
            <SplitWords text={LANDING.steps.title} dataAttr="data-howitworks-word" />
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">{LANDING.steps.subtitle}</p>
        </div>

        <HowItWorksCarousel />
      </section>

      {/* ── CHATGPT BEZWAAR ────────────────────── */}
      <section className="relative px-4 sm:px-6 py-16 md:py-20 max-w-7xl mx-auto w-full overflow-hidden section-divider">
        <ChatGptAnimations />
        <div className="space-y-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent text-center mb-3">HET ECHTE VERSCHIL</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              <SplitWords text="Kan ChatGPT dit niet ook?" dataAttr="data-chatgpt-word" />
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              <SplitWords
                text="Een eerlijke vraag. ChatGPT en Claude zijn breed bruikbaar, maar voor het toetsen van een zzp-opdracht verschilt het op een aantal concrete punten."
                dataAttr="data-chatgpt-word-body"
              />
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto mt-12 md:mt-16" data-chatgpt-table-wrap>
            {/* Decoraties achter de tabel */}
            <div data-chatgpt-decor-1 className="absolute -top-6 -left-10 w-24 h-24 rounded-full bg-accent/8 z-0" />
            <div data-chatgpt-decor-2 className="absolute -bottom-8 -right-6 w-32 h-32 rounded-full bg-primary/5 hidden md:block z-0" />
            <div data-chatgpt-decor-3 className="absolute top-1/3 -right-8 w-12 h-12 rounded-2xl bg-accent/10 rotate-12 hidden md:block z-0" />
            <div data-chatgpt-decor-4 className="absolute bottom-1/4 -left-6 w-8 h-8 rounded-full bg-accent/30 z-0" />

            {/* Subtle accent-glow achter DBA-kolom */}
            <div
              data-chatgpt-glow
              className="absolute top-0 bottom-0 right-0 w-2/5 bg-gradient-to-l from-accent/8 to-transparent rounded-r-2xl pointer-events-none z-0"
            />

            {/* Tabel */}
            <div className="relative z-10 rounded-2xl border border-border/40 overflow-hidden bg-card shadow-lg" data-chatgpt-table>
              {/* Header */}
              <div
                data-chatgpt-table-header
                className="grid grid-cols-[1fr_1.3fr_1.3fr] border-b border-border/40 bg-muted/30"
              >
                <div className="px-3 py-3 md:px-5 md:py-4" />
                <div className="px-3 py-3 md:px-5 md:py-4">
                  <h3 className="font-semibold text-muted-foreground text-xs md:text-base">Met een algemene chatbot</h3>
                </div>
                <div className="px-3 py-3 md:px-5 md:py-4 border-l border-border/40 bg-accent/5">
                  <h3 className="font-semibold text-foreground text-xs md:text-base">Met DBA Kompas</h3>
                </div>
              </div>

              {/* Rijen */}
              {[
                {
                  label: "Werkwijze",
                  chatbot: "Vereist een goede prompt; het antwoord wisselt per vraag.",
                  dba: "Plak je opdracht en krijg direct een gestructureerde analyse, geen prompting nodig.",
                },
                {
                  label: "Bij missende informatie",
                  chatbot: "Geeft antwoord ook als essentiele informatie ontbreekt; achteraf 'dat verandert de zaak'.",
                  dba: "Stelt gericht door op de ingevoerde opdracht tot het beeld volledig is.",
                },
                {
                  label: "Eerlijkheid van het oordeel",
                  chatbot: "Bevestigt suggestieve vragen en geeft het antwoord dat je wilt horen.",
                  dba: "Geeft eerlijk weer wanneer iets niet kan en levert gerichte feedback.",
                },
                {
                  label: "Beoordelingskader",
                  chatbot: "Algemene training, geen specifiek juridisch kader.",
                  dba: "Negen Deliveroo-gezichtspunten van de Hoge Raad plus Wet DBA.",
                },
                {
                  label: "Actualiteit wetgeving",
                  chatbot: "Weet er wat van, maar je moet zelf expliciet vragen om de nieuwste jurisprudentie mee te nemen.",
                  dba: "Doorlopend bijgewerkt met actuele wetgeving en jurisprudentie.",
                },
                {
                  label: "Op de hoogte gehouden",
                  chatbot: "Houdt je niet op de hoogte van nieuwe ontwikkelingen in het zzp-landschap.",
                  dba: "Dagelijkse scan van het internet, push-berichten en mails bij relevante updates.",
                },
                {
                  label: "Output",
                  chatbot: "Antwoord in een chat, lastig terug te vinden.",
                  dba: "Volledige analyse en herschreven opdrachtomschrijving, beschikbaar in PDF of Word in jouw account.",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  data-chatgpt-row
                  className="grid grid-cols-[1fr_1.3fr_1.3fr] border-b border-border/40 last:border-b-0"
                >
                  <div className="px-3 py-4 md:px-5 md:py-5 font-semibold text-foreground text-xs md:text-sm">
                    <SplitWords text={row.label} dataAttr="data-chatgpt-cell-word" />
                  </div>
                  <div className="px-3 py-4 md:px-5 md:py-5 flex gap-2 items-start text-xs md:text-sm text-muted-foreground">
                    <svg
                      data-chatgpt-icon-cross
                      className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground/50"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="6.5" y1="6.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="13.5" y1="6.5" x2="6.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="leading-relaxed">
                      <SplitWords text={row.chatbot} dataAttr="data-chatgpt-cell-word" />
                    </span>
                  </div>
                  <div className="px-3 py-4 md:px-5 md:py-5 flex gap-2 items-start text-xs md:text-sm text-foreground border-l border-border/40 bg-accent/5">
                    <svg
                      data-chatgpt-icon-check
                      className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <circle cx="10" cy="10" r="8" fill="currentColor" />
                      <path d="M6 10 L9 13 L14 7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="leading-relaxed">
                      <SplitWords text={row.dba} dataAttr="data-chatgpt-cell-word" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── METHODIEK & MAKER ──────────────────── */}
      <section className="w-full py-20 md:py-28 bg-[#0b1d3a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* DEEL A: Methodiek */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent text-center">Methodiek</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-primary-foreground text-center max-w-3xl mx-auto mt-4">
              Eén vaste methodiek, die meebeweegt met de wet
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[
                { num: "1", title: "Aansturing en gezag",      desc: "Wie bepaalt hoe en wanneer je werkt." },
                { num: "2", title: "Eigen rekening en risico", desc: "Wie draagt het risico en de kosten." },
                { num: "3", title: "Ondernemerschap",          desc: "Of je je als ondernemer gedraagt." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="text-center md:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={viewportConfig}
                >
                  <span className="block text-5xl md:text-6xl font-bold text-accent leading-none">{item.num}</span>
                  <span className="block w-8 h-0.5 bg-accent/40 mt-1 mb-3 mx-auto md:mx-0" />
                  <h3 className="text-lg md:text-xl font-semibold text-primary-foreground">{item.title}</h3>
                  <p className="text-sm text-primary-foreground/70 mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto mt-12">
              <p className="text-base md:text-lg leading-relaxed text-primary-foreground/80 mb-4">
                DBA Kompas werkt niet op onderbuik. Elke opdracht wordt beoordeeld via hetzelfde kader, op
                de drie kernpunten waarop arbeidsrelaties worden getoetst: aansturing en gezag, eigen
                rekening en risico, en ondernemerschap. Die kernpunten zijn de vertaling van de negen
                gezichtspunten die de Hoge Raad in het Deliveroo-arrest heeft benoemd en die de
                Belastingdienst gebruikt.
              </p>
              <p className="text-base md:text-lg leading-relaxed text-primary-foreground/80">
                De wetgeving rond zzp-werk staat niet stil. De handhaving is hervat, en er wordt gewerkt
                aan nieuwe regels rond zelfstandigen. DBA Kompas wordt op die ontwikkelingen onderhouden.
                Verandert het kader, dan beweegt de analyse mee. Jij hoeft die ontwikkelingen niet zelf
                bij te houden.
              </p>
            </div>

            <p className="text-sm text-primary-foreground/60 italic text-center mt-8">
              Gebaseerd op het Deliveroo-arrest van de Hoge Raad en het beoordelingskader van de Belastingdienst.
            </p>
          </motion.div>

          <hr className="border-primary-foreground/10 my-16" />

          {/* DEEL B: Maker */}
          <motion.div
            className="grid md:grid-cols-[320px_1fr] gap-12 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <div className="flex justify-center md:justify-start">
              <img
                src="/team/marvin-zoetemelk.jpg"
                alt="Marvin Zoetemelk"
                className="w-full max-w-[280px] md:max-w-none md:w-[320px] rounded-2xl border border-white/10 object-cover"
              />
            </div>

            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground">Gemaakt vanuit de praktijk</h3>
              <p className="text-base md:text-lg leading-relaxed text-primary-foreground/80 mt-4">
                DBA Kompas is ontwikkeld door Marvin Zoetemelk. Hij werkt sinds zes jaar met externe
                inhuur en heeft zich gespecialiseerd in opdrachtbeoordeling voor onder meer gemeenten,
                GGD, COA en provincies. De Wet DBA en de gevolgen voor zzp'ers volgt hij dagelijks.
                Daaruit groeide DBA Kompas: een vaste, herhaalbare manier om opdrachten te toetsen.
              </p>
              <p className="text-base md:text-lg text-primary-foreground/80 mt-6">
                Bereikbaar via{" "}
                <a href="mailto:info@dbakompas.nl" className="text-accent hover:underline">
                  info@dbakompas.nl
                </a>
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── ALTIJD ACTUEEL (nieuws + abonnement combo) ── */}
      <section
        data-aa-section
        className="relative px-4 sm:px-6 py-16 md:py-20 max-w-7xl mx-auto w-full overflow-hidden section-divider"
      >
        <NieuwsAnimations />
        <div className="grid md:grid-cols-[5fr_6fr] gap-10 md:gap-14 items-center">
          <div data-aa-text>
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">ALTIJD ACTUEEL</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-5">
              <SplitWords text="Beweeg mee met wet- en beleidsontwikkelingen" dataAttr="data-aa-word" />
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground mb-7">
              <SplitWords
                text="De wetgeving en het beleid rond zzp-werk veranderen continu. DBA Kompas scant dagelijks het internet en houdt je op de hoogte van wat het betekent voor jouw opdrachten."
                dataAttr="data-aa-word-body"
              />
            </p>

            <div className="space-y-4" data-aa-bullets>
              <div className="flex items-start gap-3" data-aa-bullet>
                <span className="block w-6 h-0.5 bg-accent mt-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-foreground mb-1">Push en mail bij relevante updates</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Direct op de hoogte als er iets verandert in wet, beleid of jurisprudentie.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3" data-aa-bullet>
                <span className="block w-6 h-0.5 bg-accent mt-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-foreground mb-1">Analyses bewaard, vergelijkbaar in de tijd</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Alle analyses op één plek, terug te halen in PDF of Word.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3" data-aa-bullet>
                <span className="block w-6 h-0.5 bg-accent mt-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-foreground mb-1">Wijzigingen toegepast op jouw opdrachten</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Bij relevante updates zie je automatisch wat het betekent voor opdrachten die je al hebt geanalyseerd.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <NieuwsIllustration />
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="features" className="relative px-4 sm:px-6 py-20 md:py-28 max-w-7xl mx-auto w-full section-divider overflow-hidden">
        <FeaturesAnimations />

        <div className="text-center mb-12 md:mb-16">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-4">WAT JE KRIJGT</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-4">
            <SplitWords text="Direct bruikbaar resultaat na elke analyse" dataAttr="data-features-word" />
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            <SplitWords
              text="Geen abstract advies, maar concrete output die je direct meeneemt naar het gesprek met opdrachtgever of intermediair."
              dataAttr="data-features-word-body"
            />
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-5" data-features-grid>
          <div data-feature-card className="relative bg-card rounded-2xl p-6 md:p-7 ring-1 ring-foreground/10 hover:ring-accent/40 transition-all duration-300 hover:-translate-y-1">
            <div className="aspect-[3/2] mb-5 rounded-xl bg-[#faf0e6] flex items-center justify-center p-3">
              <RisicoVisual />
            </div>
            <span className="block w-8 h-0.5 bg-accent mb-3" />
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Risico-indicatie op drie kernpunten</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Per kernpunt van je opdracht zie je waar aandacht nodig is, met concrete uitleg per domein.
            </p>
          </div>

          <div data-feature-card className="relative bg-card rounded-2xl p-6 md:p-7 ring-1 ring-foreground/10 hover:ring-accent/40 transition-all duration-300 hover:-translate-y-1">
            <div className="aspect-[3/2] mb-5 rounded-xl bg-[#faf0e6] flex items-center justify-center p-3">
              <AandachtspuntenVisual />
            </div>
            <span className="block w-8 h-0.5 bg-accent mb-3" />
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Concrete aandachtspunten</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Geen vaag advies, maar specifieke punten die je opdracht versterken of verzwakken.
            </p>
          </div>

          <div data-feature-card className="relative bg-card rounded-2xl p-6 md:p-7 ring-1 ring-foreground/10 hover:ring-accent/40 transition-all duration-300 hover:-translate-y-1">
            <div className="aspect-[3/2] mb-5 rounded-xl bg-[#faf0e6] flex items-center justify-center p-3">
              <OpdrachtbriefVisual />
            </div>
            <span className="block w-8 h-0.5 bg-accent mb-3" />
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Herschreven opdrachtbrief</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Direct beschikbaar in Word en PDF, klaar voor het gesprek met opdrachtgever of intermediair.
            </p>
          </div>
        </div>

      </section>

      {/* ── AUDIENCE ───────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 md:py-20 max-w-7xl mx-auto w-full section-divider">
        <motion.div
          className="space-y-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent text-center mb-3">VOOR WIE</p>
            <h2 className="text-3xl md:text-4xl font-bold">{LANDING.audience.title}</h2>
            <p className="text-muted-foreground">{LANDING.audience.supporting}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {LANDING.audience.blocks.map((block, i) => (
              <motion.div
                key={i}
                className="glass-card hover-elevate p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={viewportConfig}
              >
                <span className="block w-8 h-0.5 bg-accent mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{block.heading}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{block.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PRIJS IN VERHOUDING ────────────────── */}
      <section className="w-full py-16 md:py-20 bg-[#faf0e6]">
        <motion.div
          className="max-w-3xl mx-auto px-4 sm:px-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent text-center mb-3">DE REKENSOM</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">
            Wat kost een onduidelijke opdracht je echt?
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-muted-foreground">
            Een jurist of fiscalist inschakelen kost al snel honderden euro's. Een opdracht die niet
            wordt verlengd kost een veelvoud daarvan. Een toets met DBA Kompas kost €9,95, minder dan
            een uur van je eigen tarief.
          </p>
        </motion.div>
      </section>

      {/* ── PRICING ────────────────────────────── */}
      <section id="prijzen" className="px-4 sm:px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        <div className="space-y-12">
          <motion.div
            className="text-center space-y-3 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent">{LANDING.pricing.badge}</p>
            <h2 className="text-3xl md:text-4xl font-bold">{LANDING.pricing.title}</h2>
            <p className="text-muted-foreground">{LANDING.pricing.subtitle}</p>
          </motion.div>

          <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
            {LANDING.pricing.steeringText}
          </p>

          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {LANDING.pricing.plans.map((plan, i) => (
              <motion.div
                key={i}
                className={`relative flex flex-col rounded-2xl p-7 md:p-10 border transition-all duration-200 ${
                  plan.popular
                    ? "pricing-popular pricing-glow border-primary/30"
                    : "glass-card border-border/50 hover-elevate"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={viewportConfig}
              >
                {plan.popular && plan.popularBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex justify-center">
                    <span className="whitespace-nowrap px-4 py-1 rounded-full bg-accent text-xs font-bold text-white shadow-sm">
                      {plan.popularBadge}
                    </span>
                  </div>
                )}

                <div className="space-y-1 mb-6">
                  <h3 className={`font-bold text-lg ${plan.popular ? "text-primary-foreground" : ""}`}>
                    {plan.name}
                  </h3>
                  {plan.supporting && (
                    <p className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {plan.supporting}
                    </p>
                  )}
                </div>

                <div className={`flex items-baseline gap-1 ${plan.planKey === "yearly" ? "mb-2" : "mb-6"}`}>
                  <span className={`text-4xl font-extrabold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>

                {plan.planKey === "yearly" && (
                  <p className="text-sm text-primary-foreground/60 mb-4">Bespaar €40 ten opzichte van maandelijks</p>
                )}

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm">
                      <span className="flex-shrink-0 mt-px opacity-40 leading-[1.4rem] select-none" aria-hidden="true">·</span>
                      <span className={plan.popular ? "text-primary-foreground/85" : "text-muted-foreground"}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full btn-magnetic ${plan.popular ? "bg-accent text-white hover:bg-accent/90" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => setEmailCheckoutPlan(plan.planKey as "monthly" | "yearly" | "one_time_dba")}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground/60">{LANDING.pricing.disclaimer}</p>
        </div>
      </section>

      {/* ── TRUST ──────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 md:py-20 max-w-7xl mx-auto w-full section-divider">
        <motion.div
          className="space-y-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent text-center mb-3">HELDERE GRENZEN</p>
            <p className="text-muted-foreground">{LANDING.trust.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {LANDING.trust.items.map((item, i) => (
              <motion.div
                key={i}
                className="glass-card p-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={viewportConfig}
              >
                <span className="block w-8 h-0.5 bg-accent mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ────────────────────────────────── */}
      <section id="faq" className="px-4 sm:px-6 py-16 md:py-20 max-w-4xl mx-auto w-full section-divider">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          <div className="text-center space-y-3">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent text-center mb-3">VEELGESTELDE VRAGEN</p>
          </div>

          <div className="space-y-3">
            {LANDING.faq.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                viewport={viewportConfig}
              >
                <FaqItem question={item.question} answer={item.answer} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── BOTTOM CTA (SLOT) ──────────────────── */}
      <section className="relative px-4 sm:px-6 py-20 md:py-32 max-w-7xl mx-auto w-full overflow-hidden">
        <SlotAnimations />
        <div
          data-slot-bg
          className="relative rounded-3xl bg-primary text-primary-foreground p-12 md:p-20 overflow-hidden"
        >
          {/* Bewegende mesh-blobs */}
          <div className="absolute inset-0 opacity-60 pointer-events-none" data-slot-mesh>
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary-foreground/10 blur-3xl" />
          </div>

          {/* Decoratief kompas op achtergrond */}
          <svg
            viewBox="0 0 200 200"
            className="absolute top-1/2 right-[-50px] -translate-y-1/2 w-[400px] h-[400px] md:w-[500px] md:h-[500px] opacity-[0.07] text-accent pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
            <line x1="100" y1="5" x2="100" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="100" y1="180" x2="100" y2="195" stroke="currentColor" strokeWidth="1" />
            <line x1="5" y1="100" x2="20" y2="100" stroke="currentColor" strokeWidth="1" />
            <line x1="180" y1="100" x2="195" y2="100" stroke="currentColor" strokeWidth="1" />
            <g data-slot-needle>
              <polygon points="100,25 108,100 100,108 92,100" fill="currentColor" />
              <polygon points="100,175 108,100 100,92 92,100" fill="currentColor" opacity="0.5" />
              <circle cx="100" cy="100" r="5" fill="currentColor" />
            </g>
          </svg>

          {/* Decoratieve zwevende dots */}
          <div data-slot-decor-1 className="absolute top-12 right-12 w-3 h-3 rounded-full bg-accent pointer-events-none" />
          <div data-slot-decor-2 className="absolute bottom-16 left-16 w-4 h-4 rounded-full bg-accent/60 pointer-events-none" />
          <div data-slot-decor-3 className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-primary-foreground/40 pointer-events-none" />
          <div data-slot-decor-4 className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 rounded-full bg-accent/50 hidden md:block pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 max-w-2xl">
            <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-5">STARTEN</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
              <SplitWords text="Toets je opdracht voor je het gesprek aangaat" dataAttr="data-slot-word" />
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-primary-foreground/80 mb-8 max-w-xl">
              <SplitWords
                text="Plak je opdracht en zie binnen een minuut waar de aandachtspunten zitten, met een herschreven opdrachtbrief als werkdocument."
                dataAttr="data-slot-word-body"
              />
            </p>

            <div className="inline-block" data-slot-cta-wrap>
              <button
                data-slot-cta
                onClick={() => setQuickScanOpen(true)}
                className="group relative inline-flex items-center gap-2 bg-accent text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-shadow duration-300 hover:shadow-2xl hover:shadow-accent/40"
              >
                <span>Start je gratis zelfscan</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-primary-foreground/50 mt-6">{LANDING.disclaimer}</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="border-t border-border/40 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="space-y-2">
              <BrandLogo variant="dark" className="h-7 w-auto" />
              <p className="text-sm text-muted-foreground max-w-xs">{LANDING.footer.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-12">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{LANDING.footer.product.title}</p>
                {LANDING.footer.product.links.map((l, i) => (
                  <a key={i} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Juridisch</p>
                <Link href="/algemene-voorwaarden" className="block text-sm text-muted-foreground hover:text-accent transition-colors">Algemene Voorwaarden</Link>
                <Link href="/privacy-en-cookiebeleid" className="block text-sm text-muted-foreground hover:text-accent transition-colors">Privacy & Cookies</Link>
                <Link href="/ai-data-use-notice" className="block text-sm text-muted-foreground hover:text-accent transition-colors">AI & Gegevensverwerking</Link>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{LANDING.footer.contact.title}</p>
                <a href="mailto:info@dbakompas.nl" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{LANDING.footer.contact.email}</a>
                <p className="text-sm text-muted-foreground/60">KvK: 99964538</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/50">
            <span>{LANDING.footer.copyright}</span>
            <span>{LANDING.disclaimer}</span>
          </div>
        </div>
      </footer>

      {/* ── MODALS ─────────────────────────────── */}
      <QuickScanModal open={quickScanOpen} onOpenChange={setQuickScanOpen} />

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitch={() => setAuthModal(null)}
        />
      )}

      {emailCheckoutPlan && (
        <EmailCheckoutModal
          preselectedPlan={emailCheckoutPlan}
          onClose={() => setEmailCheckoutPlan(null)}
        />
      )}
    </div>
  );
}
