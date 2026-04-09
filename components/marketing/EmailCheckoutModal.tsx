'use client'

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type PlanKey = "monthly" | "yearly" | "one_time_dba";

interface EmailCheckoutModalProps {
  onClose: () => void;
  preselectedPlan?: PlanKey;
}

const PLANS = [
  {
    key: "one_time_dba" as PlanKey,
    name: "Eenmalige check",
    sub: "Geen abonnement",
    price: "€9,95",
    period: "eenmalig",
    badge: null,
    features: [
      "1 opdrachtomschrijving toetsen",
      "Heranalyse binnen dezelfde check",
      "Risico-indicatie en aandachtspunten",
      "Herschreven opdrachtbrief (Word-download)",
    ],
    note: "Geen toegang tot de volledige app. Direct downloaden aanbevolen.",
  },
  {
    key: "monthly" as PlanKey,
    name: "Maandelijks",
    sub: "Flexibel opzegbaar",
    price: "€20",
    period: "/maand",
    badge: null,
    features: [
      "Onbeperkt analyses",
      "Heranalyse en bijsturen",
      "Risico-indicatie en aandachtspunten",
      "Herschreven opdrachtbrief (Word-download)",
      "Toegang tot volledige app",
    ],
    note: null,
  },
  {
    key: "yearly" as PlanKey,
    name: "Jaarlijks",
    sub: "Beste waarde",
    price: "€200",
    period: "/jaar",
    badge: "Bespaar 17%",
    features: [
      "Onbeperkt analyses",
      "Heranalyse en bijsturen",
      "Risico-indicatie en aandachtspunten",
      "Herschreven opdrachtbrief (Word-download)",
      "Toegang tot volledige app",
    ],
    note: null,
  },
];

const backdropV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
const modalV = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.2 } },
};

function inputCls(error?: boolean) {
  return [
    "w-full h-11 rounded-xl border bg-background text-sm transition-all",
    "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
    "placeholder:text-muted-foreground/60",
    error
      ? "border-red-400 bg-red-50/40 focus:ring-red-300/50 focus:border-red-400"
      : "border-border",
  ].join(" ");
}

export function EmailCheckoutModal({ onClose, preselectedPlan = "yearly" }: EmailCheckoutModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState<PlanKey>(preselectedPlan);

  // Step 2 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [verifyMode, setVerifyMode] = useState(false);

  // Validation
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwOk = password.length >= 10;
  const confirmOk = confirm === password && confirm.length > 0;

  const emailErr = submitted && !emailOk;
  const pwErr = submitted && !pwOk;
  const confirmErr = submitted && !confirmOk;
  const agreeErr = submitted && !agreed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!emailOk || !pwOk || !confirmOk || !agreed) return;
    setLoading(true);
    setApiError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const emailRedirectTo = `${origin}/auth/callback?next=/checkout-redirect?plan=${plan}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo },
      });

      if (error) {
        setApiError(error.message);
        setLoading(false);
        return;
      }

      // Session aanwezig: e-mailbevestiging uitgeschakeld of auto-confirmed
      if (data.session) {
        const endpoint = plan === "one_time_dba" ? "/api/one-time/checkout" : "/api/billing/checkout";
        const body = plan === "one_time_dba" ? {} : { plan };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.url) {
          window.location.href = json.url;
        } else {
          setApiError("Kon betaallink niet ophalen. Probeer het opnieuw.");
          setLoading(false);
        }
        return;
      }

      // E-mailbevestiging vereist
      setVerifyMode(true);
      setLoading(false);
    } catch {
      setApiError("Er is iets misgegaan. Probeer het opnieuw.");
      setLoading(false);
    }
  }

  const selectedPlan = PLANS.find(p => p.key === plan)!;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          variants={backdropV}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
          variants={modalV}
          onClick={e => e.stopPropagation()}
        >
          {/* ── VERIFY SCREEN ── */}
          {verifyMode ? (
            <div className="px-6 py-8 text-center space-y-5">
              <div className="flex justify-end mb-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Controleer je e-mail</h2>
                <p className="text-sm text-muted-foreground">
                  We hebben een verificatielink gestuurd naar{" "}
                  <strong className="text-foreground">{email}</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Na verificatie word je direct doorgestuurd naar Stripe om je{" "}
                  <strong className="text-foreground">{selectedPlan.name}</strong>
                  -abonnement ({selectedPlan.price}
                  {selectedPlan.period !== "eenmalig" ? selectedPlan.period : " eenmalig"}) te activeren.
                </p>
              </div>
              <button
                onClick={() => {
                  setVerifyMode(false);
                  setEmail("");
                  setSubmitted(false);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Ander e-mailadres gebruiken
              </button>
            </div>
          ) : (
            <>
              {/* ── HEADER ── */}
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {step === 1 ? "Kies je plan" : "Account aanmaken"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {step === 1 ? "Abonnement of eenmalige check" : "Vul je gegevens in om direct te betalen"}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 -mt-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-3 mt-5 mb-2">
                  {[1, 2].map(s => (
                    <div key={s} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        step >= s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {s}
                      </div>
                      {s === 1 && <div className="w-12 h-px bg-border" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── BODY ── */}
              <div className="px-6 pb-6 pt-3 max-h-[70dvh] overflow-y-auto">
                {step === 1 ? (
                  /* ── STAP 1: PLANNEN ── */
                  <div className="space-y-3">
                    {PLANS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => setPlan(p.key)}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                          plan === p.key
                            ? "border-primary bg-primary/4"
                            : "border-border hover:border-border/80 bg-background"
                        }`}
                      >
                        {p.badge && (
                          <div className="inline-block mb-2 px-2.5 py-0.5 rounded-full bg-accent text-white text-xs font-bold">
                            {p.badge}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              plan === p.key ? "border-primary bg-primary" : "border-border"
                            }`}>
                              {plan === p.key && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.sub}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-foreground">{p.price}</span>
                            <span className="text-xs text-muted-foreground"> {p.period}</span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {plan === p.key && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                                {p.features.map((f, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                    {f}
                                  </div>
                                ))}
                                {p.note && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">{p.note}</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}

                    <button
                      onClick={() => setStep(2)}
                      className="w-full mt-2 h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors"
                    >
                      Doorgaan <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* ── STAP 2: FORMULIER ── */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => { setSubmitted(false); setApiError(null); setStep(1); }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Terug
                    </button>

                    {/* Plan dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Gekozen plan
                      </label>
                      <div className="relative">
                        <select
                          value={plan}
                          onChange={e => setPlan(e.target.value as PlanKey)}
                          className="w-full h-11 rounded-xl border border-border bg-background text-sm font-semibold text-foreground pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        >
                          {PLANS.map(p => (
                            <option key={p.key} value={p.key}>
                              {p.name} — {p.price}{p.period !== "eenmalig" ? p.period : " eenmalig"}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-foreground">E-mailadres</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          placeholder="jouw@email.nl"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className={`${inputCls(emailErr)} pl-10 pr-4`}
                        />
                      </div>
                      {emailErr && <p className="text-xs text-red-500">Voer een geldig e-mailadres in.</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-foreground">Wachtwoord</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showPw ? "text" : "password"}
                          placeholder="Minimaal 10 tekens"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className={`${inputCls(pwErr)} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(v => !v)}
                          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwErr && <p className="text-xs text-red-500">Wachtwoord moet minimaal 10 tekens zijn.</p>}
                    </div>

                    {/* Confirm */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-foreground">Wachtwoord herhalen</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Herhaal je wachtwoord"
                          value={confirm}
                          onChange={e => setConfirm(e.target.value)}
                          className={`${inputCls(confirmErr)} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmErr && <p className="text-xs text-red-500">Wachtwoorden komen niet overeen.</p>}
                    </div>

                    {/* Terms */}
                    <div className={`rounded-xl border p-4 transition-colors ${agreeErr ? "border-red-400 bg-red-50/40" : "border-border bg-muted/30"}`}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          onClick={() => setAgreed(v => !v)}
                          className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors cursor-pointer ${
                            agreed ? "bg-primary border-primary" : "border-border"
                          }`}
                        >
                          {agreed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          Je maakt een account aan voor zakelijk gebruik. Door een account aan te maken ga je akkoord met de{" "}
                          <Link href="/algemene-voorwaarden" target="_blank" className="font-semibold text-foreground hover:text-accent transition-colors">Algemene Voorwaarden</Link>,
                          {" "}het{" "}
                          <Link href="/privacy-en-cookiebeleid" target="_blank" className="font-semibold text-foreground hover:text-accent transition-colors">Privacy- en Cookiebeleid</Link>
                          {" "}en de{" "}
                          <Link href="/ai-data-use-notice" target="_blank" className="font-semibold text-foreground hover:text-accent transition-colors">AI & Data Use Notice</Link>.
                        </span>
                      </label>
                      {agreeErr && (
                        <p className="text-xs text-red-500 mt-2">Je moet akkoord gaan met de juridische documenten om door te gaan.</p>
                      )}
                    </div>

                    {/* API Error */}
                    {apiError && (
                      <div className="rounded-xl border border-red-300 bg-red-50/40 px-4 py-3">
                        <p className="text-sm text-red-600">{apiError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-60"
                    >
                      {loading ? "Even geduld..." : <>Account aanmaken &amp; betalen <ArrowRight className="w-4 h-4" /></>}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                      Je wordt direct doorgestuurd naar Stripe voor een veilige betaling.
                    </p>
                  </form>
                )}
              </div>

              {/* ── FOOTER ── */}
              <div className="px-6 pb-5 text-center text-sm text-muted-foreground border-t border-border/30 pt-4">
                Al een account?{" "}
                <Link href="/login" className="font-semibold text-foreground hover:text-accent transition-colors">
                  Inloggen →
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
