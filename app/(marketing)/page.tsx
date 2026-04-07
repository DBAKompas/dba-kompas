'use client'

import { useState, useEffect } from "react";
import {
  ArrowRight, LogOut, CheckCircle, Zap, Target, MessageSquare,
  AlertTriangle, FileText, Edit3, Newspaper, Users, Building2, Network,
  Clock, Shield, PenTool, Bell, Lock, ChevronDown, Check,
  ClipboardList, TrendingUp, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/marketing/BrandLogo";
import { Button } from "@/components/ui/button";
import { LANDING } from "@/content/landing.nl";
import AppDemoShowcase from "@/components/marketing/AppDemoShowcase";
import QuickScan from "@/components/marketing/QuickScan";
import { AuthModal } from "@/components/marketing/AuthModals";
import { EmailCheckoutModal } from "@/components/marketing/EmailCheckoutModal";
import { useMarketingAuth as useAuth } from "@/components/marketing/useMarketingAuth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { viewportConfig } from "@/lib/motion";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") || "https://app.dbakompas.nl";

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function SectionBadge({ children, withIcon }: { children: string; withIcon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-semibold border border-primary/12">
      {withIcon && (
        <img src="/logo-icon-badge.png" alt="" className="h-4 w-auto object-contain" />
      )}
      {children}
    </span>
  );
}

/** Kompas-icoon als subtiele bullet voor opsommingen */
function BulletIcon() {
  return (
    <img
      src="/logo-bullet.png"
      alt=""
      className="h-3.5 w-auto object-contain flex-shrink-0 opacity-55 mt-0.5"
    />
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-foreground hover:bg-primary/4 transition-colors"
        onClick={() => setOpen(!open)}
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
  const [authModal, setAuthModal] = useState<"login" | null>(null);
  const [emailCheckoutPlan, setEmailCheckoutPlan] = useState<"monthly" | "yearly" | "one_time_dba" | null>(null);

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

  const valueIcons = [Zap, Target, CheckCircle, MessageSquare];
  const problemIcons = [AlertTriangle, TrendingUp, BarChart3];
  const featureIcons = [ClipboardList, Edit3, Newspaper];
  const audienceIcons = [Users, Building2, Network];
  const benefitIcons = [Clock, Shield, PenTool, Bell];
  const trustIcons = [Shield, AlertTriangle, Lock];

  return (
    <div className="min-h-screen bg-background relative flex flex-col">

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
                  onClick={() => setAuthModal("login")}
                >
                  {LANDING.nav.login}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setEmailCheckoutPlan("yearly")}
                  className="btn-magnetic"
                >
                  {LANDING.nav.tryNow}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────── */}
      <section className="hero-gradient hero-shimmer px-4 sm:px-6 pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SectionBadge withIcon>{LANDING.hero.badge}</SectionBadge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {LANDING.hero.title}{" "}
            <span className="text-primary">{LANDING.hero.titleHighlight}</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {LANDING.hero.subtitle}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Button size="lg" onClick={() => setEmailCheckoutPlan("yearly")} className="btn-magnetic min-w-[240px]">
              <Zap className="w-4 h-4 mr-2 flex-shrink-0" />
              {LANDING.hero.ctaPrimary}
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = `${APP_URL}/dashboard`}>
              {LANDING.hero.ctaSecondary}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground/70 pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {LANDING.hero.supporting}
          </motion.p>
        </div>
      </section>

      {/* ── VALUE STRIP ────────────────────────── */}
      <section className="px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full section-divider">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          {LANDING.valueStrip.map((item, i) => {
            const Icon = valueIcons[i];
            return (
              <div
                key={i}
                className="glass-card hover-elevate flex items-center gap-3 px-4 py-3.5 cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground leading-tight">{item.label}</span>
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* ── QUICK SCAN ─────────────────────────── */}
      <section id="quick-scan" className="px-4 sm:px-6 py-16 md:py-20 max-w-7xl mx-auto w-full">
        <div className="space-y-10">
          <motion.div
            className="text-center space-y-3 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <SectionBadge>Gratis zelfscan</SectionBadge>
            <h2 className="text-3xl md:text-4xl font-bold">Hoe staat jouw opdracht ervoor?</h2>
            <p className="text-muted-foreground">
              Beantwoord 5 vragen over je opdracht en ontdek direct of er aandachtspunten zijn.
            </p>
          </motion.div>

          <motion.div
            data-testid="quickscan-container"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={viewportConfig}
          >
            <QuickScan />
          </motion.div>
        </div>
      </section>

      {/* ── PROBLEM ────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 md:py-20 max-w-7xl mx-auto w-full section-divider">
        <motion.div
          className="space-y-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">{LANDING.problem.title}</h2>
            <p className="text-muted-foreground">{LANDING.problem.intro}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {LANDING.problem.points.map((pt, i) => {
              const Icon = problemIcons[i];
              return (
                <motion.div
                  key={i}
                  className="glass-card hover-elevate p-6 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={viewportConfig}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-bold text-base">{pt.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pt.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── DEMO ───────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        <div className="space-y-12">
          <motion.div
            className="text-center space-y-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <SectionBadge>{LANDING.appDemo.badge}</SectionBadge>
            <h2 className="text-3xl md:text-4xl font-bold">{LANDING.appDemo.title}</h2>
            <p className="text-muted-foreground">{LANDING.appDemo.subtitle}</p>
          </motion.div>

          <motion.div
            className="demo-glow-wrapper rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 0 0 1px hsl(217 44% 20% / 0.1), 0 16px 48px hsl(217 44% 20% / 0.12)" }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={viewportConfig}
          >
            <AppDemoShowcase />
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section className="px-4 sm:px-6 py-16 md:py-20 max-w-7xl mx-auto w-full section-divider">
        <motion.div
          className="space-y-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={viewportConfig}
        >
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">{LANDING.steps.title}</h2>
            <p className="text-muted-foreground">{LANDING.steps.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connector line desktop */}
            <div className="hidden md:block absolute top-9 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            {LANDING.steps.items.map((step, i) => (
              <motion.div
                key={i}
                className="relative flex flex-col items-center text-center gap-4 p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                viewport={viewportConfig}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-extrabold shadow-md z-10">
                  {step.step}
                </div>
                <h3 className="font-bold text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="features" className="px-4 sm:px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        <div className="space-y-12">
          <motion.div
            className="text-center space-y-3 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <SectionBadge>{LANDING.values.badge}</SectionBadge>
            <p className="text-muted-foreground">{LANDING.values.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {LANDING.values.items.map((item, i) => {
              const Icon = featureIcons[i];
              return (
                <motion.div
                  key={i}
                  className="glass-card hover-elevate p-6 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={viewportConfig}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Continuing value block */}
          <motion.div
            className="glass-card p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-bold">{LANDING.continuingValue.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{LANDING.continuingValue.body}</p>
            </div>
            <div className="flex-1 space-y-1">
              {LANDING.continuingValue.bullets.map((b, i) => (
                <div key={i} className="checklist-row">
                  <BulletIcon />
                  <span className="text-sm font-medium">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
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
            <h2 className="text-3xl md:text-4xl font-bold">{LANDING.audience.title}</h2>
            <p className="text-muted-foreground">{LANDING.audience.supporting}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {LANDING.audience.blocks.map((block, i) => {
              const Icon = audienceIcons[i];
              return (
                <motion.div
                  key={i}
                  className="glass-card hover-elevate p-6 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={viewportConfig}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-bold">{block.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{block.text}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── BENEFITS ───────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        <div className="space-y-12">
          <motion.div
            className="text-center space-y-3 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={viewportConfig}
          >
            <SectionBadge>{LANDING.benefits.badge}</SectionBadge>
            <h2 className="text-3xl md:text-4xl font-bold">{LANDING.benefits.title}</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {LANDING.benefits.items.map((item, i) => {
              const Icon = benefitIcons[i];
              return (
                <motion.div
                  key={i}
                  className="glass-card hover-elevate p-5 flex items-start gap-4"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={viewportConfig}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Showcase / checklist block */}
          <motion.div
            className="glass-card pricing-glow p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={viewportConfig}
          >
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">{LANDING.benefits.showcase.title}</h3>
              <p className="text-muted-foreground">{LANDING.benefits.showcase.subtitle}</p>
              <Button className="btn-magnetic mt-2" onClick={() => setEmailCheckoutPlan("yearly")}>
                Start je analyse
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="space-y-1">
              {LANDING.benefits.checklist.map((item, i) => (
                <div key={i} className="checklist-row">
                  <BulletIcon />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
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
            <SectionBadge>{LANDING.trust.badge}</SectionBadge>
            <p className="text-muted-foreground">{LANDING.trust.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {LANDING.trust.items.map((item, i) => {
              const Icon = trustIcons[i];
              return (
                <motion.div
                  key={i}
                  className="glass-card p-6 space-y-3"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={viewportConfig}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
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
            <SectionBadge>{LANDING.pricing.badge}</SectionBadge>
            <h2 className="text-3xl md:text-4xl font-bold">{LANDING.pricing.title}</h2>
            <p className="text-muted-foreground">{LANDING.pricing.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {LANDING.pricing.plans.map((plan, i) => (
              <motion.div
                key={i}
                className={`relative flex flex-col rounded-2xl p-7 border transition-all duration-200 ${
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
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-accent text-xs font-bold text-white shadow-sm">
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

                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm">
                      {plan.popular
                        ? <img src="/logo-flat-white.png" alt="" className="h-4 w-auto object-contain flex-shrink-0 opacity-80 mt-0.5" />
                        : <BulletIcon />
                      }
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
            <SectionBadge>{LANDING.faq.badge}</SectionBadge>
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

      {/* ── BOTTOM CTA ─────────────────────────── */}
      <section className="px-4 sm:px-6 py-20 md:py-28 max-w-7xl mx-auto w-full">
        <motion.div
          className="cta-gradient-block text-center space-y-6 max-w-2xl mx-auto p-10 md:p-14 rounded-3xl relative overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={viewportConfig}
        >
          {/* shimmer overlay */}
          <div className="pointer-events-none absolute inset-0 cta-shimmer" />
          <img src="/logo-white-v3.png" alt="DBA Kompas" className="h-10 w-auto mx-auto relative z-10" />
          <h2 className="text-3xl md:text-4xl font-bold text-white relative z-10">{LANDING.cta.title}</h2>
          <p className="text-white/70 relative z-10">{LANDING.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
            <Button size="lg" onClick={() => setEmailCheckoutPlan("yearly")} className="btn-magnetic min-w-[180px] bg-white text-primary hover:bg-white/90 border-0">
              {LANDING.cta.primary}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="ghost" onClick={() => document.getElementById("quick-scan")?.scrollIntoView({ behavior: "smooth" })} className="text-white hover:bg-white/15 hover:text-white border border-white/30">
              {LANDING.cta.secondary}
            </Button>
          </div>
          <p className="text-xs text-white/40 relative z-10">{LANDING.disclaimer}</p>
        </motion.div>
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
