"use client";

export function CompassDecoration() {
  return (
    <svg
      className="absolute top-1/4 right-[-10%] w-[400px] h-[400px] opacity-[0.06] pointer-events-none animate-[spin_60s_linear_infinite] hidden lg:block text-accent"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <line x1="100" y1="5" x2="100" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="100" y1="180" x2="100" y2="195" stroke="currentColor" strokeWidth="1" />
      <line x1="5" y1="100" x2="20" y2="100" stroke="currentColor" strokeWidth="1" />
      <line x1="180" y1="100" x2="195" y2="100" stroke="currentColor" strokeWidth="1" />
      <polygon points="100,30 105,100 100,110 95,100" fill="currentColor" />
      <polygon points="100,170 105,100 100,90 95,100" fill="currentColor" opacity="0.5" />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
    </svg>
  );
}
