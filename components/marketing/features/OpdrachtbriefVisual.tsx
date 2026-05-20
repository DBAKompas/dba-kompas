"use client";

export function OpdrachtbriefVisual() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="6" width="80" height="68" rx="5" fill="#fefdfb" stroke="rgb(212, 120, 42)" strokeWidth="1" />
      <line x1="30" y1="18" x2="65" y2="18" stroke="rgb(11, 29, 58)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="30" y1="32" x2="90" y2="32" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <rect x="30" y="40" width="55" height="8" rx="2" fill="rgb(212, 120, 42)" opacity="0.25" />
      <line x1="30" y1="44" x2="90" y2="44" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
      <line x1="30" y1="56" x2="85" y2="56" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <g transform="translate(50 64)">
        <rect x="0" y="0" width="20" height="9" rx="4" fill="rgb(212, 120, 42)" />
        <text x="10" y="6.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="white">PDF</text>
        <rect x="22" y="0" width="22" height="9" rx="4" fill="rgb(11, 29, 58)" />
        <text x="33" y="6.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="white">WORD</text>
      </g>
    </svg>
  );
}
