"use client";

export function IndicatiefVisual() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M 15 65 A 45 45 0 0 1 105 65" fill="none" stroke="rgb(11, 29, 58)" strokeWidth="6" strokeLinecap="round" opacity="0.15" />
      <path data-indicatief-arc d="M 15 65 A 45 45 0 0 1 80 27" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="6" strokeLinecap="round" />
      <line data-indicatief-needle x1="60" y1="65" x2="78" y2="33" stroke="rgb(11, 29, 58)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="65" r="5" fill="rgb(11, 29, 58)" />
      <text x="60" y="78" textAnchor="middle" fontSize="9" fill="rgb(11, 29, 58)" opacity="0.5" fontWeight="600">indicatie</text>
    </svg>
  );
}
