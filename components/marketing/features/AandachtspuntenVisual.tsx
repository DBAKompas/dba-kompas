"use client";

const ITEMS = [
  { y: 22, color: "rgb(16, 185, 129)" },
  { y: 40, color: "rgb(16, 185, 129)" },
  { y: 58, color: "rgb(212, 120, 42)" },
];

export function AandachtspuntenVisual() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="8" width="100" height="64" rx="6" fill="#fefdfb" stroke="rgb(212, 120, 42)" strokeWidth="1" />
      {ITEMS.map((item, i) => (
        <g key={i}>
          <circle cx="22" cy={item.y} r="5" fill={item.color} />
          <path
            d={`M 19 ${item.y} L 21.5 ${item.y + 2.5} L 26 ${item.y - 2}`}
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="32" y1={item.y} x2="80" y2={item.y} stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" />
          <line x1="32" y1={item.y + 3.5} x2="68" y2={item.y + 3.5} stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.18" />
        </g>
      ))}
    </svg>
  );
}
