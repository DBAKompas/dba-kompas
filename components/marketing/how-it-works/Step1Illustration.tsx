"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function Step1Illustration() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.from("[data-s1-doc]", { y: -50, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from("[data-s1-arrow]", { opacity: 0, y: -20, duration: 0.6, delay: 0.3, ease: "power2.out" });
      gsap.from("[data-s1-line]", {
        opacity: 0,
        x: -8,
        duration: 0.3,
        stagger: 0.15,
        delay: 0.5,
        ease: "power2.out",
      });
      gsap.from("[data-s1-cursor]", { opacity: 0, duration: 0.4, delay: 1.4 });
      gsap.to("[data-s1-cursor]", {
        opacity: 0.2,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        delay: 1.8,
        ease: "sine.inOut",
      });

      // Idle floating decorations
      const decorMoves = [
        { sel: "[data-s1-decor-1]", y: -12, x: 6, dur: 4.5 },
        { sel: "[data-s1-decor-2]", y: 10, x: -8, dur: 5.5 },
        { sel: "[data-s1-decor-3]", y: -8, x: 10, dur: 4 },
        { sel: "[data-s1-decor-4]", y: 12, x: -6, dur: 5 },
      ];
      decorMoves.forEach(({ sel, y, x, dur }) => {
        gsap.to(sel, { y, x, duration: dur, ease: "sine.inOut", repeat: -1, yoyo: true });
      });
    });
    return () => ctx.revert();
  });

  return (
    <svg
      viewBox="0 0 800 500"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Decoraties */}
      <circle data-s1-decor-1 cx="80" cy="100" r="35" fill="rgb(212, 120, 42)" opacity="0.15" />
      <rect data-s1-decor-2 x="680" y="380" width="50" height="50" rx="8" fill="rgb(11, 29, 58)" opacity="0.1" />
      <circle data-s1-decor-3 cx="730" cy="120" r="12" fill="rgb(212, 120, 42)" opacity="0.5" />
      <circle data-s1-decor-4 cx="180" cy="430" r="8" fill="rgb(212, 120, 42)" opacity="0.5" />

      {/* Upload-pijl */}
      <g data-s1-arrow opacity="0.8">
        <line x1="400" y1="40" x2="400" y2="120" stroke="rgb(212, 120, 42)" strokeWidth="3" strokeLinecap="round" />
        <polyline points="380,100 400,120 420,100" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Document */}
      <g data-s1-doc>
        <rect x="220" y="140" width="360" height="320" rx="14" fill="#fefdfb" stroke="rgb(212, 120, 42)" strokeWidth="1.5" />
        <line x1="250" y1="180" x2="380" y2="180" stroke="rgb(11, 29, 58)" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
        <line x1="250" y1="200" x2="320" y2="200" stroke="rgb(11, 29, 58)" strokeWidth="2" opacity="0.3" strokeLinecap="round" />

        <line data-s1-line x1="250" y1="240" x2="540" y2="240" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line data-s1-line x1="250" y1="260" x2="520" y2="260" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line data-s1-line x1="250" y1="280" x2="550" y2="280" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line data-s1-line x1="250" y1="300" x2="500" y2="300" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line data-s1-line x1="250" y1="320" x2="540" y2="320" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line data-s1-line x1="250" y1="340" x2="480" y2="340" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

        <rect data-s1-cursor x="487" y="335" width="3" height="14" fill="rgb(212, 120, 42)" />
      </g>
    </svg>
  );
}
