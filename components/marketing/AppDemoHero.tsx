"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "logo-intro" | "input" | "analyzing" | "result";

const SAMPLE_TEXT =
  "IT-architect voor digitale transformatie. De opdrachtnemer werkt zelfstandig vanuit eigen kantoor, factureert per maand, gebruikt eigen apparatuur en heeft meerdere opdrachtgevers in 2026.";

const CHIPS = [
  "Zelfstandige uitvoering",
  "Facturering",
  "Eigen middelen",
  "Vrije vervanging",
  "Meerdere opdrachtgevers",
  "Resultaatsverbintenis",
];

const DOMAINS = [
  { label: "Aansturing & Gezag", score: 88 },
  { label: "Eigen Rekening & Risico", score: 88 },
  { label: "Extern Ondernemerschap", score: 88 },
];

const TIMINGS: Record<Phase, number> = {
  "logo-intro": 800,
  input: 5000,
  analyzing: 3000,
  result: 5000,
};

const ANALYZE_STEPS = [
  { label: "Tekst geanalyseerd", duration: 600 },
  { label: "DBA-criteria getoetst", duration: 600 },
  { label: "Risico in kaart", duration: 600 },
  { label: "Aanbevelingen", duration: 500 },
  { label: "Rapport afgerond", duration: 400 },
];

const phaseTransition = {
  initial: { opacity: 0, scale: 1.02 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.3 },
};

export function AppDemoHero({
  paused = false,
  startDelayMs = 0,
}: {
  paused?: boolean;
  startDelayMs?: number;
}) {
  const [phase, setPhase] = useState<Phase>("logo-intro");
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    if (r) {
      setPhase("result");
      setStarted(true);
      return;
    }
    const t = setTimeout(() => setStarted(true), startDelayMs);
    return () => clearTimeout(t);
  }, [startDelayMs]);

  useEffect(() => {
    if (reduced || paused || !started) return;
    const next: Phase =
      phase === "logo-intro"
        ? "input"
        : phase === "input"
          ? "analyzing"
          : phase === "analyzing"
            ? "result"
            : "input"; // result → input (logo-intro maar eerste keer)
    const t = setTimeout(() => setPhase(next), TIMINGS[phase]);
    return () => clearTimeout(t);
  }, [phase, paused, reduced, started]);

  return (
    <div className="relative w-full aspect-[16/10] bg-card overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "logo-intro" && (
          <motion.div key="logo-intro" {...phaseTransition} className="absolute inset-0">
            <LogoIntroView />
          </motion.div>
        )}
        {phase === "input" && (
          <motion.div key="input" {...phaseTransition} className="absolute inset-0">
            <InputView />
          </motion.div>
        )}
        {phase === "analyzing" && (
          <motion.div key="analyzing" {...phaseTransition} className="absolute inset-0">
            <AnalyzingView />
          </motion.div>
        )}
        {phase === "result" && (
          <motion.div key="result" {...phaseTransition} className="absolute inset-0">
            <ResultView reduced={reduced} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LogoIntroView() {
  return (
    <div className="h-full w-full bg-card flex flex-col items-center justify-center gap-2 p-6">
      <motion.img
        src="/logo-dark-v3.png"
        alt="DBA Kompas"
        className="h-10 md:h-12 w-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="text-xs md:text-sm text-muted-foreground"
      >
        Compliance hulpmiddel voor ZZP&apos;ers
      </motion.p>
    </div>
  );
}

function InputView() {
  const [typed, setTyped] = useState("");
  const [showSignals, setShowSignals] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTyped(SAMPLE_TEXT.slice(0, i));
      if (i >= SAMPLE_TEXT.length) {
        clearInterval(id);
      }
    }, 30);
    const t = setTimeout(() => setShowSignals(true), 2800);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, []);

  const charCount = typed.length;
  const wordCount = typed.trim() ? typed.trim().split(/\s+/).length : 0;

  return (
    <div className="h-full w-full p-3 md:p-4 flex flex-col gap-2 text-xs">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground text-[11px]">Nieuwe analyse</p>
        <p className="text-[9px] text-muted-foreground">
          <span className="font-semibold text-accent">1 Invoer</span> · 2 Bevestigen
        </p>
      </div>

      <div className="rounded-md border border-border/60 p-2.5 bg-background/40 min-h-[60px]">
        <p className="text-[10px] text-foreground leading-relaxed">
          {typed}
          <span className="inline-block w-[2px] h-[1em] align-middle bg-accent animate-pulse ml-0.5" />
        </p>
      </div>

      <p className="text-[9px] text-muted-foreground">
        {charCount} tekens · {wordCount} woorden
      </p>

      <AnimatePresence>
        {showSignals && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground text-[11px]">Kernsignalen herkend</p>
              <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[9px] font-bold">6/10</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-accent"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {CHIPS.map((c, i) => (
                <motion.span
                  key={c}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.25 }}
                  className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-700"
                >
                  ✓ {c}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      <button className="self-end px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold pointer-events-none">
        Volgende: controleren →
      </button>
    </div>
  );
}

function AnalyzingView() {
  const [progress, setProgress] = useState<number[]>(() => ANALYZE_STEPS.map(() => 0));
  const [done, setDone] = useState<boolean[]>(() => ANALYZE_STEPS.map(() => false));

  useEffect(() => {
    let cancelled = false;
    let stepIndex = 0;

    const runStep = () => {
      if (cancelled || stepIndex >= ANALYZE_STEPS.length) return;
      const idx = stepIndex;
      const dur = ANALYZE_STEPS[idx].duration;
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min((now - start) / dur, 1);
        setProgress((prev) => {
          const next = [...prev];
          next[idx] = Math.round(p * 100);
          return next;
        });
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          setDone((prev) => {
            const next = [...prev];
            next[idx] = true;
            return next;
          });
          stepIndex += 1;
          runStep();
        }
      };
      requestAnimationFrame(tick);
    };

    runStep();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-primary text-primary-foreground h-full w-full flex flex-col items-center justify-center p-5">
      <img src="/logo-white-v3.png" alt="DBA Kompas" className="h-5 md:h-6 mb-5" />

      <div className="relative w-20 h-20 md:w-24 md:h-24 mb-4">
        <img
          src="/logo-icon-badge.png"
          alt=""
          className="absolute inset-0 m-auto w-10 h-10 md:w-12 md:h-12 opacity-40"
        />
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgb(212, 120, 42)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="283"
            className="animate-circle-breathe"
          />
        </svg>
      </div>

      <h3 className="text-base md:text-lg font-bold mb-3">Analyseren...</h3>

      <div className="w-full max-w-[280px] space-y-2">
        {ANALYZE_STEPS.map((step, i) => (
          <StepRow key={step.label} label={step.label} progress={progress[i]} complete={done[i]} />
        ))}
      </div>
    </div>
  );
}

function StepRow({
  label,
  progress,
  complete,
}: {
  label: string;
  progress: number;
  complete: boolean;
}) {
  const barColor = complete ? "bg-emerald-400" : "bg-accent";
  const ringColor = complete ? "text-emerald-400" : "text-accent";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-primary-foreground/80 w-24 truncate text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-primary-foreground/15 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-150 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={`relative w-3.5 h-3.5 ${ringColor}`}>
        {complete ? (
          <svg viewBox="0 0 20 20" className="w-full h-full">
            <circle cx="10" cy="10" r="8" fill="currentColor" />
            <path d="M6 10 L9 13 L14 7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : progress > 0 ? (
          <svg viewBox="0 0 20 20" fill="none" className="w-full h-full animate-spin">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="20 30"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" className="w-full h-full opacity-30">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </div>
    </div>
  );
}

function ResultView({ reduced }: { reduced: boolean }) {
  const [score, setScore] = useState(reduced ? 88 : 0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1800;
    const animate = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(88 * eased));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="h-full w-full p-3 md:p-4 flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">← Terug</p>
        <div className="flex gap-1">
          <span className="px-2 py-0.5 rounded-md border border-border/60 text-[9px] text-foreground">PDF</span>
          <span className="px-2 py-0.5 rounded-md border border-border/60 text-[9px] text-foreground">Word</span>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
        <div className="relative size-14 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="size-full -rotate-90">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="#d1fae5" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-emerald-700 leading-none">{score}%</span>
            <span className="text-[7px] text-emerald-700/70">conform</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.08em] text-emerald-700/80 font-semibold">DBA RISICO-ANALYSE</p>
          <p className="text-base font-bold text-emerald-900 leading-tight">Laag risico</p>
          <p className="text-[9px] text-emerald-700/70">19 mei 2026</p>
        </div>
      </div>

      <p className="text-[10px] font-semibold text-foreground">Beoordeling per domein</p>
      <div className="grid grid-cols-3 gap-2">
        {DOMAINS.map((d, i) => (
          <motion.div
            key={d.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.6 + i * 0.18, duration: 0.3 }}
            className="rounded-md border border-emerald-200 p-2 bg-white"
          >
            <p className="text-sm font-bold text-emerald-700">{d.score}%</p>
            <p className="text-[8px] text-muted-foreground leading-tight mt-0.5">{d.label}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[7px] font-semibold">
              Laag
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
