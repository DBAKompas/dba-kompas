"use client";

const DOTS = [20, 55, 90, 125, 160];

export function AbonnementVisual() {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-full" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="10" y1="30" x2="190" y2="30" stroke="rgb(212, 120, 42)" strokeWidth="1.5" opacity="0.4" />
      {DOTS.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="30" r={i === 2 ? 6 : 4} fill="rgb(212, 120, 42)" opacity={i === 2 ? 1 : 0.5} />
          {i === 2 && (
            <circle data-abo-pulse cx={x} cy="30" r="11" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="1.5" opacity="0.4" />
          )}
        </g>
      ))}
      <g transform="translate(86 8)">
        <path
          d="M 4 0 L 4 4 M 0 14 L 8 14 M 4 4 C 1 4 0 7 0 10 L 0 14 L 8 14 L 8 10 C 8 7 7 4 4 4 Z M 3 14 L 5 14 L 5 16 L 3 16 Z"
          fill="white"
        />
      </g>
    </svg>
  );
}
