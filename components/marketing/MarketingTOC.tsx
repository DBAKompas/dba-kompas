"use client";
import { useEffect, useState } from "react";

const SECTIES = [
  { id: "hero", label: "Hero" },
  { id: "antwoord", label: "Antwoord" },
  { id: "inzet", label: "Inzet" },
  { id: "functies", label: "Hoe het werkt" },
  { id: "chatgpt", label: "Vergelijking" },
  { id: "methodiek", label: "Methodiek" },
  { id: "altijd-actueel", label: "Altijd actueel" },
  { id: "voor-wie", label: "Voor wie" },
  { id: "prijzen", label: "Prijzen" },
  { id: "faq", label: "Veelgestelde vragen" },
];

export function MarketingTOC() {
  const [activeId, setActiveId] = useState<string>("hero");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observers: IntersectionObserver[] = [];
    SECTIES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveId(s.id);
          });
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav
      aria-label="Pagina-inhoud"
      className="hidden lg:block fixed left-6 xl:left-10 top-1/2 -translate-y-1/2 z-30"
    >
      <ul className="space-y-2.5">
        {SECTIES.map((s) => {
          const active = activeId === s.id;
          return (
            <li key={s.id} className="group">
              <a href={`#${s.id}`} className="flex items-center gap-3 text-xs">
                <span
                  className={`block transition-all duration-300 rounded-full ${
                    active
                      ? "w-6 h-1.5 bg-accent"
                      : "w-2 h-2 bg-foreground/20 group-hover:bg-foreground/40"
                  }`}
                />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    active
                      ? "opacity-100 text-foreground font-medium"
                      : "opacity-0 group-hover:opacity-100 text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
