"use client";

export function RisicoVisual() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(40 40)">
        <circle r="28" fill="none" stroke="rgb(11, 29, 58)" strokeWidth="2" opacity="0.15" />
        <circle
          r="28"
          fill="none"
          stroke="rgb(212, 120, 42)"
          strokeWidth="3"
          strokeDasharray="175"
          strokeDashoffset="40"
          strokeLinecap="round"
          transform="rotate(-90)"
        />
        <text textAnchor="middle" y="6" fontSize="16" fontWeight="700" fill="rgb(11, 29, 58)">
          85%
        </text>
      </g>
      <g transform="translate(85 15)">
        <circle cx="0" cy="0" r="6" fill="rgb(212, 120, 42)" />
        <circle cx="0" cy="22" r="6" fill="rgb(212, 120, 42)" opacity="0.7" />
        <circle cx="0" cy="44" r="6" fill="rgb(212, 120, 42)" opacity="0.5" />
        <line x1="14" y1="0" x2="34" y2="0" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" />
        <line x1="14" y1="22" x2="30" y2="22" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" />
        <line x1="14" y1="44" x2="32" y2="44" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" />
      </g>
    </svg>
  );
}
