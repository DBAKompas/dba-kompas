"use client";

export function PrivacyVisual() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M 60 12 L 80 22 L 80 45 C 80 58 70 67 60 70 C 50 67 40 58 40 45 L 40 22 Z"
        fill="rgb(212, 120, 42)"
        opacity="0.08"
      />
      <path
        d="M 60 12 L 80 22 L 80 45 C 80 58 70 67 60 70 C 50 67 40 58 40 45 L 40 22 Z"
        fill="none"
        stroke="rgb(11, 29, 58)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        data-privacy-check
        d="M 50 42 L 57 49 L 70 35"
        stroke="rgb(212, 120, 42)"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
