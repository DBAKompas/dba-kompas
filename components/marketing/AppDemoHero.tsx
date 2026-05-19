"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InputView } from "./app-views/InputView";
import { AnalyzingView } from "./app-views/AnalyzingView";
import { ResultView } from "./app-views/ResultView";

type Phase = "logo-intro" | "input" | "analyzing" | "result";

const TIMINGS: Record<Phase, number> = {
  "logo-intro": 700,
  input: 3500,
  analyzing: 2800,
  result: 3500,
};

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
            : "input";
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
            <InputView active />
          </motion.div>
        )}
        {phase === "analyzing" && (
          <motion.div key="analyzing" {...phaseTransition} className="absolute inset-0">
            <AnalyzingView active />
          </motion.div>
        )}
        {phase === "result" && (
          <motion.div key="result" {...phaseTransition} className="absolute inset-0">
            <ResultView active />
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
