'use client'

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Zap,
  CheckCircle,
  Upload,
  Check,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from "lucide-react";

const INTERVAL = 4000;

const tabs = [
  {
    number: 1,
    title: "Upload opdracht",
    description: "Voer je opdrachtomschrijving in of upload een document",
  },
  {
    number: 2,
    title: "AI Analyse",
    description: "De AI toetst je tekst aan de bekende gezichtspunten",
  },
  {
    number: 3,
    title: "Resultaat",
    description: "Ontvang een overzicht met aandachtspunten en score",
  },
];

function TabUpload() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold">Opdrachtomschrijving</span>
      </div>

      <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-muted/20">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Sleep je document hierheen...</p>
          <p className="text-xs text-muted-foreground mt-0.5">PDF, Word of plak je tekst hieronder</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60"
            style={{ width: "60%", animation: "pulse 2s ease-in-out infinite" }}
          />
        </div>
        <div className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-md">
          Analyseer
        </div>
      </div>
    </div>
  );
}

function TabAnalyse() {
  const items = [
    { label: "Gezichtspunt 1", status: "done" },
    { label: "Gezichtspunt 2", status: "done" },
    { label: "Gezichtspunt 3", status: "loading" },
    { label: "Gezichtspunt 4", status: "pending" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold">Analyseren</span>
        <span className="inline-flex gap-[3px] ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {item.status === "done" && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            )}
            {item.status === "loading" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              </div>
            )}
            {item.status === "pending" && (
              <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 opacity-40" />
            )}
            <span
              className={`text-sm ${
                item.status === "pending"
                  ? "text-muted-foreground/40"
                  : item.status === "loading"
                    ? "text-foreground font-medium"
                    : "text-foreground"
              }`}
            >
              {item.label}
            </span>
            {item.status === "done" && (
              <span className="text-[10px] text-emerald-500 font-medium ml-auto">Voltooid</span>
            )}
            {item.status === "loading" && (
              <span className="text-[10px] text-primary font-medium ml-auto">Bezig...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabResultaat() {
  const positief = ["Duidelijke resultaatverplichting", "Eigen materiaal en gereedschap", "Vrijheid van werktijden"];
  const aandacht = ["Vaste werkplek op locatie opdrachtgever", "Geen vervanging geregeld"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <span className="text-sm font-semibold">Resultaat</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="text-4xl font-bold gradient-text">7/10</div>
        <div className="text-sm text-muted-foreground leading-snug">
          Je opdrachtomschrijving scoort<br />
          redelijk op de gezichtspunten.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Positieve punten</span>
          </div>
          <ul className="space-y-1.5">
            {positief.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">Aandachtspunten</span>
          </div>
          <ul className="space-y-1.5">
            {aandacht.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-primary font-medium pt-1">
        <ChevronRight className="w-3.5 h-3.5" />
        4 verbeterpunten beschikbaar
      </div>
    </div>
  );
}

export function AnimatedTabs() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % 3);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-testid="animated-tabs"
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        {tabs.map((tab, i) => (
          <button
            key={tab.number}
            className={`text-left p-3 rounded-xl border transition-all ${
              i === active
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-border/80"
            }`}
            onClick={() => setActive(i)}
            data-testid={`tab-${i}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.number}
              </span>
              <span className={`text-sm ${i === active ? "font-bold" : "font-medium text-muted-foreground"}`}>
                {tab.title}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug pl-8">
              {tab.description}
            </p>
          </button>
        ))}
      </div>

      <div className="border border-border rounded-xl bg-card p-5">
        <div key={active} style={{ animation: "demo-fade-up 0.4s ease-out" }}>
          {active === 0 && <TabUpload />}
          {active === 1 && <TabAnalyse />}
          {active === 2 && <TabResultaat />}
        </div>
      </div>
    </div>
  );
}
