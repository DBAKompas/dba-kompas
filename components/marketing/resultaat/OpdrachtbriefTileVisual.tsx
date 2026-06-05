"use client";
import { useEffect, useState } from "react";

const SECTIES = [
  {
    heading: "Doel",
    body: "Deze opdracht richt zich op het opleveren van een gevalideerd migratieplan voor de cloudtransformatie, inclusief technische architectuur en risico-analyse.",
  },
  {
    heading: "Resultaten",
    body: "Bij oplevering: een goedgekeurd migratieplan, een werkende proof-of-concept en een implementatie-roadmap voor het verdere traject.",
  },
  {
    heading: "Zelfstandigheid",
    body: "De opdrachtnemer bepaalt zelfstandig de werkwijze, tools en planning. Geen vaste werktijden of dagelijkse aansturing vanuit de opdrachtgever.",
  },
];

const TYPE_SPEED = 18;
const PAUSE_BETWEEN = 800;
const RESTART_PAUSE = 2500;

export function OpdrachtbriefTileVisual() {
  const [sectieIndex, setSectieIndex] = useState(0);
  const [typedText, setTypedText] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedText(SECTIES.map((s) => s.body));
      setSectieIndex(SECTIES.length - 1);
      return;
    }

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms);
        if (cancelled) clearTimeout(t);
      });

    const runCyclus = async () => {
      while (!cancelled) {
        setTypedText(["", "", ""]);
        setSectieIndex(0);
        await wait(120);
        if (cancelled) return;

        for (let si = 0; si < SECTIES.length; si++) {
          if (cancelled) return;
          setSectieIndex(si);
          const fullText = SECTIES[si].body;
          for (let ci = 0; ci <= fullText.length; ci++) {
            if (cancelled) return;
            setTypedText((prev) => {
              const next = [...prev];
              next[si] = fullText.slice(0, ci);
              return next;
            });
            await wait(TYPE_SPEED);
          }
          await wait(PAUSE_BETWEEN);
        }

        await wait(RESTART_PAUSE);
      }
    };

    void runCyclus();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-lg ring-1 ring-foreground/10 p-5 md:p-6">
        {SECTIES.map((sectie, i) => {
          const isActive = sectieIndex === i;
          const isVisible = sectieIndex >= i;
          const showCursor = isActive && typedText[i].length < sectie.body.length;

          return (
            <div
              key={sectie.heading}
              className={`transition-opacity duration-300 ${i > 0 ? "mt-4" : ""} ${
                isVisible ? "opacity-100" : "opacity-30"
              }`}
            >
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-accent mb-1">
                {sectie.heading}
              </h4>
              <p className="text-xs leading-relaxed text-foreground">
                {typedText[i]}
                {showCursor && (
                  <span className="inline-block w-[2px] h-[1em] bg-accent ml-[1px] align-middle animate-pulse" />
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
