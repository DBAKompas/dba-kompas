"use client";
import { useEffect, useState } from "react";

const ANALYZE_STEPS = [
  { label: "Tekst geanalyseerd", duration: 450 },
  { label: "DBA-criteria getoetst", duration: 450 },
  { label: "Risico in kaart", duration: 450 },
  { label: "Aanbevelingen", duration: 450 },
  { label: "Rapport afgerond", duration: 400 },
];

export function AnalyzingView({ active = true }: { active?: boolean }) {
  const [progress, setProgress] = useState<number[]>(() => ANALYZE_STEPS.map(() => 0));
  const [done, setDone] = useState<boolean[]>(() => ANALYZE_STEPS.map(() => false));

  useEffect(() => {
    if (!active) {
      setProgress(ANALYZE_STEPS.map(() => 0));
      setDone(ANALYZE_STEPS.map(() => false));
      return;
    }
    setProgress(ANALYZE_STEPS.map(() => 0));
    setDone(ANALYZE_STEPS.map(() => false));

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
  }, [active]);

  return (
    <div className="bg-primary text-primary-foreground h-full w-full flex flex-col items-center justify-center px-6 py-8">
      <div className="relative w-20 h-20 md:w-24 md:h-24 mb-6">
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
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="283"
            className="animate-circle-breathe"
          />
        </svg>
      </div>

      <h3 className="text-base md:text-lg font-semibold mb-5 text-primary-foreground/90">Analyseren...</h3>

      <div className="w-full max-w-[280px] space-y-2.5">
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
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-primary-foreground/70 w-[110px] truncate text-right tabular-nums">
        {label}
      </span>
      <div className="flex-1 h-1 bg-primary-foreground/15 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={`relative w-3.5 h-3.5 ${ringColor}`}>
        {complete ? (
          <svg viewBox="0 0 20 20" className="w-full h-full" fill="currentColor">
            <circle cx="10" cy="10" r="8" />
          </svg>
        ) : progress > 0 ? (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-full h-full animate-spin"
            style={{ animationDuration: "1.2s" }}
          >
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="22 28"
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
