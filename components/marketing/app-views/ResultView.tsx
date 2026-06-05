"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const DOMAINS = [
  { label: "Aansturing & Gezag", score: 88 },
  { label: "Eigen Rekening & Risico", score: 88 },
  { label: "Extern Ondernemerschap", score: 88 },
];

export function ResultView({ active = true }: { active?: boolean }) {
  const [score, setScore] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!active) {
      setScore(0);
      return;
    }
    if (reduced) {
      setScore(88);
      setCycleKey((k) => k + 1);
      return;
    }
    setScore(0);
    setCycleKey((k) => k + 1);
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const animate = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(88 * eased));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced]);

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
            key={`${cycleKey}-${d.label}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.4 + i * 0.15, duration: 0.3 }}
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
