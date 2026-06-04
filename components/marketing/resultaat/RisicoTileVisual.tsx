"use client";
import { useEffect, useRef, useState } from "react";
import { useGsap } from "@/lib/animations/useGsap";

const TERMEN = [
  "Langdurige opdracht",
  "Inbedding in team",
  "Een opdrachtgever",
  "Vaste werktijden",
  "Geen eigen middelen",
  "Repeterende verlenging",
  "Aansturing manager",
  "Geen vrije vervanging",
  "Geen commercieel risico",
  "Vast uurtarief",
  "Geen eigen kantoor",
  "Persoonlijke uitvoering verplicht",
];

const POSITIES: Array<{ angle: number; distance: number }> = [
  { angle: -90, distance: 95 },
  { angle: -45, distance: 105 },
  { angle: 0, distance: 110 },
  { angle: 45, distance: 105 },
  { angle: 90, distance: 95 },
  { angle: 135, distance: 105 },
  { angle: 180, distance: 110 },
  { angle: 225, distance: 105 },
];

const VISIBLE_MS = 2000;
const CYCLE_MS = 2800;

export function RisicoTileVisual() {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const [visibleTermen, setVisibleTermen] = useState<Record<number, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleTermen({ 0: TERMEN[0], 2: TERMEN[1], 4: TERMEN[2], 6: TERMEN[3] });
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];
    let cancelled = false;

    POSITIES.forEach((_, posIndex) => {
      let termIndex = posIndex;
      const showTerm = () => {
        if (cancelled) return;
        const current = TERMEN[termIndex % TERMEN.length];
        setVisibleTermen((prev) => ({ ...prev, [posIndex]: current }));
        const hide = setTimeout(() => {
          setVisibleTermen((prev) => {
            const next = { ...prev };
            delete next[posIndex];
            return next;
          });
        }, VISIBLE_MS);
        timeouts.push(hide);
        termIndex++;
      };

      const startDelay = posIndex * 350;
      const start = setTimeout(() => {
        if (cancelled) return;
        showTerm();
        const interval = setInterval(showTerm, CYCLE_MS);
        intervals.push(interval);
      }, startDelay);
      timeouts.push(start);
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, []);

  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      if (scoreRef.current) {
        const target = { val: 0 };
        gsap.to(target, {
          val: 88,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            if (scoreRef.current) scoreRef.current.textContent = String(Math.round(target.val));
          },
          scrollTrigger: { trigger: scoreRef.current, start: "top 90%", once: true },
        });
      }
    });
    return () => ctx.revert();
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="relative" style={{ width: 280, height: 240 }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg viewBox="0 0 100 100" className="w-24 h-24" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(11, 29, 58)" strokeWidth="3" opacity="0.12" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgb(212, 120, 42)"
              strokeWidth="4"
              strokeDasharray="264"
              strokeDashoffset="32"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground leading-none">
              <span ref={scoreRef}>0</span>
              <span className="text-base">%</span>
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">conform</span>
          </div>
        </div>

        {POSITIES.map((pos, i) => {
          const radians = (pos.angle * Math.PI) / 180;
          const x = Math.cos(radians) * pos.distance;
          const y = Math.sin(radians) * pos.distance;
          const term = visibleTermen[i];
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              <div
                className={`px-2.5 py-1 rounded-full bg-card ring-1 ring-foreground/10 text-[10px] font-medium text-foreground whitespace-nowrap transition-opacity duration-300 shadow-sm ${
                  term ? "opacity-100" : "opacity-0"
                }`}
              >
                {term || " "}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
