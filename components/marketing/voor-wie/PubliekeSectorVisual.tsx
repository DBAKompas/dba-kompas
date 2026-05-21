"use client";

export function PubliekeSectorVisual() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="50" r="32" fill="rgb(212, 120, 42)" opacity="0.08" />
      <polygon points="35,30 60,15 85,30" fill="none" stroke="rgb(11, 29, 58)" strokeWidth="2" strokeLinejoin="round" />
      <line x1="35" y1="30" x2="85" y2="30" stroke="rgb(11, 29, 58)" strokeWidth="2" />
      <rect x="38" y="32" width="6" height="28" fill="rgb(11, 29, 58)" opacity="0.85" />
      <rect x="57" y="32" width="6" height="28" fill="rgb(11, 29, 58)" opacity="0.85" />
      <rect x="76" y="32" width="6" height="28" fill="rgb(11, 29, 58)" opacity="0.85" />
      <rect x="32" y="60" width="56" height="4" fill="rgb(11, 29, 58)" />
      <rect x="30" y="64" width="60" height="2" fill="rgb(11, 29, 58)" opacity="0.6" />
      <line x1="60" y1="15" x2="60" y2="8" stroke="rgb(212, 120, 42)" strokeWidth="1.5" />
      <polygon points="60,8 65,9.5 60,11" fill="rgb(212, 120, 42)" />
    </svg>
  );
}
