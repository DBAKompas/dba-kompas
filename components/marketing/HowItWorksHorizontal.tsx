"use client";
import { useEffect, useRef, type ComponentType } from "react";
import { Step1Illustration } from "./how-it-works/Step1Illustration";
import { Step3Illustration as Step4Illustration } from "./how-it-works/Step3Illustration";
import { RisicoTileVisual } from "./resultaat/RisicoTileVisual";
import { OpdrachtbriefTileVisual } from "./resultaat/OpdrachtbriefTileVisual";

const Step2Wrapped: ComponentType = () => (
  <div className="w-full h-full bg-[#faf0e6]">
    <RisicoTileVisual />
  </div>
);

const Step3Wrapped: ComponentType = () => (
  <div className="w-full h-full bg-[#faf0e6]">
    <OpdrachtbriefTileVisual />
  </div>
);

const STAPPEN: Array<{
  number: string;
  title: string;
  description: string;
  illustration: ComponentType;
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
    description: "Een percentage met uitleg waar de aandachtspunten zitten.",
    illustration: Step2Wrapped,
  },
  {
    number: "03",
    title: "Ontvang je herschreven opdrachtbrief",
    description: "Direct beschikbaar in PDF en Word, klaar om te delen.",
    illustration: Step3Wrapped,
  },
  {
    number: "04",
    title: "Ga sterker het gesprek in",
    description: "Gebruik de aandachtspunten en de herschreven opdrachtbrief.",
    illustration: Step4Illustration,
  },
];

export function HowItWorksHorizontal() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapMod, stMod]) => {
        const gsap = gsapMod.default;
        const ScrollTrigger = stMod.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        const wrapper = wrapperRef.current;
        const track = trackRef.current;
        if (!wrapper || !track) return;

        const slideCount = STAPPEN.length;

        const tween = gsap.to(track, {
          x: () => -(slideCount - 1) * wrapper.offsetWidth,
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: () => `+=${wrapper.offsetWidth * (slideCount - 1)}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        cleanup = () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      },
    );

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative overflow-hidden">
      <div
        ref={trackRef}
        className="flex h-screen"
        style={{ width: `${STAPPEN.length * 100}vw` }}
      >
        {STAPPEN.map((stap, i) => {
          const Illustration = stap.illustration;
          return (
            <div
              key={i}
              className="flex-shrink-0 h-full flex items-center justify-center px-8 lg:px-20"
              style={{ width: "100vw" }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto w-full">
                <div className="min-w-0">
                  <div className="text-5xl lg:text-6xl font-bold text-accent">{stap.number}</div>
                  <h3 className="text-2xl lg:text-3xl font-bold mt-4 text-foreground">{stap.title}</h3>
                  <p className="text-base lg:text-lg text-muted-foreground mt-3 leading-relaxed">{stap.description}</p>
                </div>
                <div className="aspect-[3/2] bg-[#faf0e6] rounded-2xl overflow-hidden flex items-center justify-center w-full">
                  <Illustration />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
