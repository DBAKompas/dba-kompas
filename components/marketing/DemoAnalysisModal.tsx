'use client'
import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Check,
  Loader2,
  ChevronDown,
  Copy,
  RotateCcw,
  ArrowRight,
  Shield,
  Circle,
} from "lucide-react";
import { DEMO } from "@/content/demoAnalysis.nl";

type Phase =
  | "idle"
  | "scanning"
  | "analyzing"
  | "scoring"
  | "signals"
  | "complete"
  | "generating_brief"
  | "brief_ready";

const PHASE_TIMINGS: Record<Phase, number> = {
  idle: 0,
  scanning: 0,
  analyzing: 1500,
  scoring: 2800,
  signals: 4000,
  complete: 4500,
  generating_brief: 7000,
  brief_ready: 10500,
};

const PHASE_ORDER: Phase[] = [
  "scanning",
  "analyzing",
  "scoring",
  "signals",
  "complete",
  "generating_brief",
  "brief_ready",
];

function useTypingEffect(text: string, active: boolean, speed = 15) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);
  return displayed;
}

function ScoreRing({ score, active }: { score: number; active: boolean }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const pct = score / 10;
  const offset = circumference - pct * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={active ? offset : circumference}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}/10</span>
        <span className="text-xs text-accent font-semibold uppercase">{DEMO.scoreLabel}</span>
      </div>
    </div>
  );
}

function BalanceBar() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <span className="text-red-500 font-medium">3</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden flex">
        <div className="bg-red-400 h-full" style={{ width: "50%" }} />
        <div className="bg-emerald-400 h-full" style={{ width: "50%" }} />
      </div>
      <span className="text-emerald-500 font-medium">3</span>
    </div>
  );
}

function SignalCard({
  type,
  items,
  visible,
}: {
  type: "positive" | "negative";
  items: { title: string; description: string }[];
  visible: number;
}) {
  const isPositive = type === "positive";
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {isPositive ? (
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        )}
        <span
          className={`text-xs font-semibold ${
            isPositive
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"
          }`}
        >
          {isPositive ? "Positieve punten" : "Aandachtspunten"}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item.title}
            className="transition-all duration-500 ease-out"
            style={{
              opacity: i < visible ? 1 : 0,
              transform: i < visible ? "translateY(0)" : "translateY(8px)",
              transitionDelay: `${i * 200}ms`,
            }}
          >
            <div className="text-xs font-medium mb-0.5">{item.title}</div>
            <p className="text-[11px] text-muted-foreground leading-snug">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoAnalysisModal() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [signalsVisible, setSignalsVisible] = useState(0);
  const [briefTab, setBriefTab] = useState<"full" | "compact">("full");
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const briefText = useTypingEffect(
    DEMO.geoptimaliseerdeBrief,
    phase === "generating_brief" || phase === "brief_ready",
    12,
  );

  const startAnalysis = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setSignalsVisible(0);
    setCopied(false);
    setBriefTab("full");

    for (const p of PHASE_ORDER) {
      const t = setTimeout(() => setPhase(p), PHASE_TIMINGS[p]);
      timersRef.current.push(t);
    }

    const signalStart = PHASE_TIMINGS.signals;
    for (let i = 1; i <= 6; i++) {
      const t = setTimeout(() => setSignalsVisible(i), signalStart + i * 300);
      timersRef.current.push(t);
    }
  }, []);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("idle");
    setSignalsVisible(0);
    setCopied(false);
    setBriefTab("full");
  }, []);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase !== "idle" && containerRef.current) {
      const el = containerRef.current;
      const timeout = setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  const handleCopy = () => {
    navigator.clipboard.writeText(DEMO.geoptimaliseerdeBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const isRunning = phase !== "idle";

  const analyseSteps = DEMO.analyseStappen.map((label, i) => {
    let status: "done" | "loading" | "pending" = "pending";
    if (phase === "analyzing") {
      if (i < 2) status = "done";
      else if (i === 2) status = "loading";
    } else if (phaseIndex > 1 && isRunning) {
      status = "done";
    }
    return { label, status };
  });

  return (
    <div className="border border-border rounded-2xl bg-card shadow-xl overflow-hidden" data-testid="demo-analysis-modal">
      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-800/30 px-4 py-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
          {DEMO.disclaimer}
        </span>
      </div>

      {/* Scrollable Content */}
      <div ref={containerRef} className="relative max-h-[520px] overflow-y-auto p-5 space-y-5">
        {/* Idle */}
        {phase === "idle" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Probeer een DBA-analyse</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Bekijk hoe DBA Kompas een opdrachtomschrijving analyseert op basis van de bekende gezichtspunten.
                We gebruiken een fictieve casus als voorbeeld.
              </p>
            </div>
            <button
              onClick={startAnalysis}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              data-testid="start-analysis-btn"
            >
              Start analyse
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scanning */}
        {isRunning && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opdrachtomschrijving</span>
            <div className="bg-muted/30 rounded-lg border border-border/50 p-3 text-xs text-muted-foreground leading-relaxed relative overflow-hidden">
              {DEMO.opdracht}
              {phase === "scanning" && (
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
              )}
            </div>
          </div>
        )}

        {/* Analyzing */}
        {phaseIndex >= 1 && isRunning && (
          <div className="space-y-2">
            <span className="text-xs font-semibold">Analyse voortgang</span>
            <div className="space-y-2">
              {analyseSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-2.5">
                  {step.status === "done" && (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                  )}
                  {step.status === "loading" && (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    </div>
                  )}
                  {step.status === "pending" && (
                    <Circle className="w-5 h-5 text-muted-foreground/20" />
                  )}
                  <span
                    className={`text-xs ${
                      step.status === "pending" ? "text-muted-foreground/40" : "text-foreground"
                    } ${step.status === "loading" ? "font-medium" : ""}`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scoring */}
        {phaseIndex >= 2 && isRunning && (
          <div className="space-y-3">
            <ScoreRing score={DEMO.score} active={phaseIndex >= 2} />
            <BalanceBar />
          </div>
        )}

        {/* Signals */}
        {phaseIndex >= 3 && isRunning && (
          <div className="grid grid-cols-2 gap-4">
            <SignalCard type="negative" items={DEMO.aandachtspunten} visible={Math.min(signalsVisible, 3)} />
            <SignalCard type="positive" items={DEMO.positievePunten} visible={Math.max(signalsVisible - 3, 0)} />
          </div>
        )}

        {/* Complete - Verbeterpunten + Aannames */}
        {phaseIndex >= 4 && isRunning && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold mb-2 block">Verbeterpunten</span>
              <div className="space-y-2">
                {DEMO.verbeterpunten.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground leading-snug transition-all duration-500"
                    style={{
                      opacity: phaseIndex >= 4 ? 1 : 0,
                      transitionDelay: `${i * 150}ms`,
                    }}
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold mb-2 block">Aannames</span>
              <div className="space-y-1.5">
                {DEMO.aannames.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-snug">
                    <span className="text-muted-foreground/40 mt-px">•</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generating brief / brief ready */}
        {phaseIndex >= 5 && isRunning && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Geoptimaliseerde opdrachtomschrijving</span>
              {phase === "brief_ready" && (
                <div className="flex items-center gap-2">
                  <div className="flex bg-muted rounded-md p-0.5">
                    <button
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        briefTab === "full" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                      }`}
                      onClick={() => setBriefTab("full")}
                    >
                      Uitgebreid
                    </button>
                    <button
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        briefTab === "compact" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                      }`}
                      onClick={() => setBriefTab("compact")}
                    >
                      Compact
                    </button>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] text-primary font-medium hover:opacity-80 transition-opacity"
                    data-testid="copy-brief-btn"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Gekopieerd" : "Kopieer"}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-muted/20 rounded-lg border border-border/50 p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {briefText}
              {phase === "generating_brief" && (
                <span className="animate-blink text-primary font-bold">|</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {phase === "brief_ready" && (
          <div className="flex flex-col items-center gap-3 pt-2 pb-1">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="reset-analysis-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Opnieuw
            </button>
            <a
              href={((process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") || "https://app.dbakompas.nl")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              data-testid="cta-try-yourself"
            >
              Probeer het zelf
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Scroll Indicator */}
        {isRunning && phase !== "brief_ready" && (
          <div className="sticky bottom-0 left-0 right-0 pointer-events-none">
            <div className="h-10 bg-gradient-to-t from-card to-transparent" />
            <div className="flex justify-center -mt-4">
              <ChevronDown className="w-4 h-4 text-muted-foreground/40 animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
