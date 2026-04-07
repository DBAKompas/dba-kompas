'use client'

import { useState, useEffect } from "react";
import { ArrowRight, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import BrandLogo from "@/components/marketing/BrandLogo";
import { Button } from "@/components/ui/button";
import { LANDING } from "@/content/landing.nl";
import AppDemoShowcase from "@/components/marketing/AppDemoShowcase";
import QuickScanModal from "@/components/marketing/QuickScanModal";
import { AuthModal } from "@/components/marketing/AuthModals";
import { EmailCheckoutModal } from "@/components/marketing/EmailCheckoutModal";
import { useMarketingAuth as useAuth } from "@/components/marketing/useMarketingAuth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { viewportConfig } from "@/lib/motion";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") || "https://app.dbakompas.nl";

function SectionBadge({
  children,
  icon: Icon,
}: {
  children: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium">
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </span>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | null>(null);
  const [emailCheckoutPlan, setEmailCheckoutPlan] = useState<"monthly" | "yearly" | "one_time_dba" | null>(null);
  const [quickScanOpen, setQuickScanOpen] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      window.location.href = "/";
    });
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* HEADER */}
      <header
        className={`sticky top-0 z-40 border-b border-border/40 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo variant="flatDarkV2" className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {LANDING.nav.features}
            </a>
            <a href="#prijzen" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {LANDING.nav.pricing}
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {LANDING.nav.faq}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthModal("login")}
                >
                  {LANDING.nav.login}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setEmailCheckoutPlan("yearly")}
                >
                  {LANDING.nav.tryNow}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-4 sm:px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SectionBadge>{LANDING.hero.badge}</SectionBadge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {LANDING.hero.title}
            {" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {LANDING.hero.titleHighlight}
            </span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {LANDING.hero.subtitle}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button size="lg" onClick={() => setEmailCheckoutPlan("yearly")}>
              {LANDING.hero.ctaPrimary}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setQuickScanOpen(true)}>
              {LANDING.hero.ctaSecondary}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* APP DEMO */}
      <section className="px-4 sm:px-6 py-24 max-w-7xl mx-auto w-full">
        <div className="space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={viewportConfig}
            >
              <SectionBadge>{LANDING.appDemo.badge}</SectionBadge>
            </motion.div>
            <motion.h2
              className="text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={viewportConfig}
            >
              {LANDING.appDemo.title}
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={viewportConfig}
          >
            <AppDemoShowcase />
          </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-4 sm:px-6 py-24 max-w-7xl mx-auto w-full text-center">
        <motion.div
          className="space-y-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          <h2 className="text-3xl md:text-4xl font-bold">{LANDING.cta.title}</h2>
          <p className="text-muted-foreground">{LANDING.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" onClick={() => setEmailCheckoutPlan("yearly")}>
              {LANDING.cta.primary}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setQuickScanOpen(true)}>
              {LANDING.cta.secondary}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 py-12 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p className="mb-4">{LANDING.footer.tagline}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              {LANDING.nav.brand}
            </Link>
            <Link href="/algemene-voorwaarden" className="hover:text-foreground transition-colors">
              Algemene Voorwaarden
            </Link>
            <Link href="/privacy-en-cookiebeleid" className="hover:text-foreground transition-colors">
              Privacy & Cookies
            </Link>
            <a href="mailto:info@dbakompas.nl" className="hover:text-foreground transition-colors">
              {LANDING.footer.contact.email}
            </a>
          </div>
          <p className="text-xs opacity-50">{LANDING.footer.copyright}</p>
        </div>
      </footer>

      {/* MODALS */}
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

      <QuickScanModal
        open={quickScanOpen}
        onOpenChange={setQuickScanOpen}
      />
    </div>
  );
}
