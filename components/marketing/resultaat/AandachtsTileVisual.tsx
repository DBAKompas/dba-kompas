"use client";
import { useEffect, useState } from "react";

const ITEMS = ["Aansturing en gezag", "Eigen rekening en risico", "Ondernemerschap"];

export function AandachtsTileVisual() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveIndex(ITEMS.length);
      return;
    }
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % (ITEMS.length + 2));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[200px] space-y-3">
        {ITEMS.map((item, i) => {
          const isChecked = activeIndex > i || activeIndex >= ITEMS.length + 1;
          return (
            <div
              key={item}
              className={`flex items-center gap-2.5 transition-all duration-500 ${
                isChecked ? "opacity-100" : "opacity-60"
              }`}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isChecked ? "bg-emerald-500 scale-100" : "bg-foreground/10 scale-95"
                }`}
              >
                <svg
                  className={`w-3 h-3 text-white transition-opacity duration-300 ${
                    isChecked ? "opacity-100" : "opacity-0"
                  }`}
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M3 7 L6 10 L11 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-500 ${
                  isChecked ? "text-foreground" : "text-foreground/60"
                }`}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
