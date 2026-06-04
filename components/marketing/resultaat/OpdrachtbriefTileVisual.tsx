"use client";
import { useEffect, useState } from "react";
import { useGsap } from "@/lib/animations/useGsap";

export function OpdrachtbriefTileVisual() {
  const [format, setFormat] = useState<"PDF" | "WORD">("PDF");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setFormat((f) => (f === "PDF" ? "WORD" : "PDF"));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.to("[data-opdracht-hl-1]", {
        opacity: 0.4,
        duration: 1.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to("[data-opdracht-hl-2]", {
        opacity: 0.4,
        duration: 1.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.6,
      });
    });
    return () => ctx.revert();
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <svg viewBox="0 0 200 160" className="w-full h-full" aria-hidden="true">
        <rect x="40" y="20" width="120" height="120" rx="6" fill="#fefdfb" stroke="rgb(212, 120, 42)" strokeWidth="1.5" />
        <line x1="55" y1="40" x2="105" y2="40" stroke="rgb(11, 29, 58)" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
        <line x1="55" y1="58" x2="145" y2="58" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />

        <rect data-opdracht-hl-1 x="53" y="68" width="80" height="8" rx="2" fill="rgb(212, 120, 42)" opacity="0.15" />
        <line x1="55" y1="72" x2="145" y2="72" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />

        <line x1="55" y1="85" x2="135" y2="85" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />

        <rect data-opdracht-hl-2 x="53" y="95" width="60" height="8" rx="2" fill="rgb(212, 120, 42)" opacity="0.15" />
        <line x1="55" y1="99" x2="135" y2="99" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />

        <line x1="55" y1="112" x2="145" y2="112" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
        <line x1="55" y1="122" x2="120" y2="122" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      </svg>

      <div className="absolute bottom-4 right-4 flex gap-1.5">
        <div
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold text-white transition-all duration-500 ${
            format === "PDF" ? "bg-accent scale-110 shadow-md" : "bg-foreground/30 scale-100"
          }`}
        >
          PDF
        </div>
        <div
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold text-white transition-all duration-500 ${
            format === "WORD" ? "bg-accent scale-110 shadow-md" : "bg-foreground/30 scale-100"
          }`}
        >
          WORD
        </div>
      </div>
    </div>
  );
}
