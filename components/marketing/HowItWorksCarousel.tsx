"use client";
import { useState, useEffect, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Step1Illustration } from "./how-it-works/Step1Illustration";
import { Step2Illustration } from "./how-it-works/Step2Illustration";
import { Step3Illustration } from "./how-it-works/Step3Illustration";

type IllustrationComponent = ComponentType;

const STEPS: Array<{
  number: string;
  title: string;
  description: string;
  illustration: IllustrationComponent;
}> = [
  {
    number: "01",
    title: "Plak of upload je opdracht",
    description: "Je opdrachtomschrijving of het document, direct in de app.",
    illustration: Step1Illustration,
  },
  {
    number: "02",
    title: "Bekijk je risico-indicatie",
    description: "De analyse laat per kernpunt zien waar aandacht nodig is.",
    illustration: Step2Illustration,
  },
  {
    number: "03",
    title: "Ga sterker het gesprek in",
    description: "Gebruik de aandachtspunten en de herschreven opdrachtbrief.",
    illustration: Step3Illustration,
  },
];

const AUTOPLAY_MS = 4500;
const TICK_MS = 50;

export function HowItWorksCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced || isPaused) return;
    let elapsed = 0;
    setProgress(0);
    const id = setInterval(() => {
      elapsed += TICK_MS;
      const pct = Math.min((elapsed / AUTOPLAY_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= AUTOPLAY_MS) {
        elapsed = 0;
        setActiveIndex((i) => (i + 1) % STEPS.length);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isPaused, activeIndex, reduced]);

  const handleSelect = (i: number) => {
    setActiveIndex(i);
    setProgress(0);
  };

  const ActiveIllustration = STEPS[activeIndex].illustration;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="grid md:grid-cols-[5fr_7fr] gap-8 md:gap-12 items-center">
        {/* LINKS: stap-cards */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={step.number}
                onClick={() => handleSelect(i)}
                className={`relative w-full text-left rounded-xl p-5 md:p-6 transition-all duration-300 overflow-hidden ${
                  isActive
                    ? "bg-card ring-1 ring-accent/30 shadow-lg"
                    : "bg-transparent ring-1 ring-transparent hover:bg-card/50"
                }`}
              >
                <div className="flex items-baseline gap-4">
                  <span
                    className={`text-2xl md:text-3xl font-bold leading-none transition-colors ${
                      isActive ? "text-accent" : "text-muted-foreground/50"
                    }`}
                  >
                    {step.number}
                  </span>
                  <div className="flex-1">
                    <h3
                      className={`text-lg md:text-xl font-semibold mb-1 transition-colors ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-sm md:text-base transition-colors ${
                        isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>

                {isActive && !isPaused && !reduced && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent/15">
                    <div
                      className="h-full bg-accent ease-linear"
                      style={{
                        width: `${progress}%`,
                        transition: "width 50ms linear",
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* RECHTS: custom SVG-illustratie per stap */}
        <div className="relative">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <ActiveIllustration />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
