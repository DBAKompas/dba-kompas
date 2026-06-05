"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export function InputView({ active = true }: { active?: boolean }) {
  const [typed, setTyped] = useState("");
  const [showSignals, setShowSignals] = useState(false);

  useEffect(() => {
    if (!active) {
      setTyped("");
      setShowSignals(false);
      return;
    }
    setTyped("");
    setShowSignals(false);
    const limit = Math.min(SAMPLE_TEXT.length, 145);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTyped(SAMPLE_TEXT.slice(0, Math.min(i, limit)));
      if (i >= limit) clearInterval(id);
    }, 25);
    const t = setTimeout(() => setShowSignals(true), 1800);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [active]);

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
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.2 }}
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
