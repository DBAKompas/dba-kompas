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
  { angle: -90, distance: 110 },
  { angle: -45, distance: 160 },
  { angle: 0, distance: 170 },
  { angle: 45, distance: 160 },
  { angle: 90, distance: 110 },
  { angle: 135, distance: 160 },
  { angle: 180, distance: 170 },
  { angle: 225, distance: 160 },
];

const FADE_MS = 1500;
const VISIBLE_MS = 3000;
const CYCLE_MS = FADE_MS + VISIBLE_MS + FADE_MS; // 6000
const STAGGER_MS = 750;

type TermState = { term: string; visible: boolean };

export function RisicoTileVisual() {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const [termStates, setTermStates] = useState<Record<number, TermState>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const init: Record<number, TermState> = {};
      [0, 2, 4, 6].forEach((posIndex, termIdx) => {
        init[posIndex] = { term: TERMEN[termIdx], visible: true };
      });
      setTermStates(init);
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    POSITIES.forEach((_, posIndex) => {
      let termIndex = posIndex;

      const runCyclus = () => {
        const term = TERMEN[termIndex % TERMEN.length];
        setTermStates((prev) => ({ ...prev, [posIndex]: { term, visible: false } }));
        const tFadeIn = setTimeout(() => {
          setTermStates((prev) => ({ ...prev, [posIndex]: { term, visible: true } }));
        }, 50);
        const tFadeOut = setTimeout(() => {
          setTermStates((prev) => ({ ...prev, [posIndex]: { term, visible: false } }));
        }, 50 + FADE_MS + VISIBLE_MS);
        timeouts.push(tFadeIn, tFadeOut);
        termIndex++;
      };

      const startDelay = posIndex * STAGGER_MS;
      const tStart = setTimeout(() => {
        runCyclus();
        const interval = setInterval(runCyclus, CYCLE_MS);
        intervals.push(interval);
      }, startDelay);
      timeouts.push(tStart);
    });

    return () => {
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
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative" style={{ width: 380, height: 280 }}>
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
          const state = termStates[i];
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 pointer-events-none"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              <div
                className={`px-2.5 py-1 rounded-full bg-card/90 ring-1 ring-foreground/10 text-[10px] font-medium text-foreground whitespace-nowrap transition-opacity ease-out ${
                  state?.visible ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDuration: `${FADE_MS}ms` }}
              >
                {state?.term || " "}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
