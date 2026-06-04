"use client";
import { useRef } from "react";
import { useGsap } from "@/lib/animations/useGsap";

export function RisicoTileVisual() {
  const scoreRef = useRef<SVGTSpanElement>(null);

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

      gsap.to("[data-risico-pulse]", {
        scale: 1.08,
        opacity: 0.15,
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "center",
      });

      [1, 2, 3].forEach((i) => {
        gsap.to(`[data-risico-dot-${i}]`, {
          y: i % 2 === 0 ? -4 : 4,
          duration: 2.5 + i * 0.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    });
    return () => ctx.revert();
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <svg viewBox="0 0 200 160" className="w-full h-full" aria-hidden="true">
        <circle data-risico-pulse cx="80" cy="80" r="55" fill="rgb(212, 120, 42)" opacity="0.1" />
        <circle cx="80" cy="80" r="42" fill="none" stroke="rgb(11, 29, 58)" strokeWidth="3" opacity="0.12" />
        <circle cx="80" cy="80" r="42" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="4"
                strokeDasharray="264" strokeDashoffset="32" strokeLinecap="round"
                transform="rotate(-90 80 80)" />
        <text x="80" y="80" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" fill="rgb(11, 29, 58)">
          <tspan ref={scoreRef}>0</tspan>
          <tspan fontSize="16" dy="-6">%</tspan>
        </text>
        <text x="80" y="100" textAnchor="middle" fontSize="10" fill="rgb(11, 29, 58)" opacity="0.6">conform</text>

        <g data-risico-dot-1>
          <circle cx="150" cy="50" r="6" fill="rgb(212, 120, 42)" />
          <text x="160" y="54" fontSize="9" fill="rgb(11, 29, 58)" opacity="0.7">Gezag</text>
        </g>
        <g data-risico-dot-2>
          <circle cx="150" cy="80" r="6" fill="rgb(212, 120, 42)" opacity="0.7" />
          <text x="160" y="84" fontSize="9" fill="rgb(11, 29, 58)" opacity="0.7">Risico</text>
        </g>
        <g data-risico-dot-3>
          <circle cx="150" cy="110" r="6" fill="rgb(212, 120, 42)" opacity="0.5" />
          <text x="160" y="114" fontSize="9" fill="rgb(11, 29, 58)" opacity="0.7">Onderneming</text>
        </g>
      </svg>
    </div>
  );
}
