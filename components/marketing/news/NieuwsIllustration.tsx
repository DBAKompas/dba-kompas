"use client";

export function NieuwsIllustration() {
  return (
    <div className="relative aspect-[3/4] w-full max-w-[420px] mx-auto md:mx-0" data-nieuws-visual>
      {/* Decoraties achter */}
      <div
        data-nieuws-decor-1
        className="absolute -top-4 -right-6 w-20 h-20 rounded-full bg-accent/8 z-0"
      />
      <div
        data-nieuws-decor-2
        className="absolute top-1/3 -left-10 w-28 h-28 rounded-full bg-primary/5 hidden md:block z-0"
      />
      <div
        data-nieuws-decor-3
        className="absolute bottom-8 -right-4 w-16 h-16 rounded-2xl bg-accent/10 rotate-12 hidden md:block z-0"
      />

      {/* SVG hoofd-mockup */}
      <svg
        viewBox="0 0 600 540"
        className="relative w-full h-full z-10"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Feed-header */}
        <line x1="50" y1="30" x2="120" y2="30" stroke="rgb(212, 120, 42)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <text x="50" y="58" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.6" fontWeight="700">NIEUWS FEED</text>

        {/* Card 1 — TOP (oranje accent) */}
        <g data-nieuws-card-1>
          <rect x="44" y="82" width="520" height="150" rx="14" fill="rgb(11, 29, 58)" opacity="0.05" />
          <rect x="40" y="78" width="520" height="150" rx="14" fill="#fefdfb" stroke="rgb(212, 120, 42)" strokeWidth="2" />

          <rect x="70" y="100" width="78" height="22" rx="11" fill="rgb(212, 120, 42)" />
          <text x="109" y="116" fontSize="11" fill="white" fontWeight="700" textAnchor="middle">NIEUW</text>

          <text x="160" y="116" fontSize="11" fill="rgb(212, 120, 42)" fontWeight="600">Wetgeving · Handhaving</text>

          <text x="70" y="152" fontSize="17" fill="rgb(11, 29, 58)" fontWeight="700">Handhaving Wet DBA: actuele stand</text>

          <line x1="70" y1="174" x2="510" y2="174" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <line x1="70" y1="190" x2="430" y2="190" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />

          <circle cx="78" cy="216" r="3" fill="rgb(11, 29, 58)" opacity="0.4" />
          <text x="90" y="220" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.55">19 mei 2026 · Belastingdienst</text>

          <rect data-nieuws-pulse x="40" y="78" width="520" height="150" rx="14" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="2" opacity="0.5" />
        </g>

        {/* Card 2 — MIDDLE */}
        <g data-nieuws-card-2>
          <rect x="40" y="250" width="520" height="150" rx="14" fill="#fefdfb" stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.85" />

          <text x="70" y="285" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.6" fontWeight="700">WETSVOORSTEL</text>
          <text x="70" y="318" fontSize="16" fill="rgb(11, 29, 58)" fontWeight="700">Zelfstandigenwet: stand van voortgang</text>

          <line x1="70" y1="340" x2="510" y2="340" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
          <line x1="70" y1="356" x2="460" y2="356" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />

          <circle cx="78" cy="382" r="3" fill="rgb(11, 29, 58)" opacity="0.4" />
          <text x="90" y="386" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.55">12 mei 2026 · Rijksoverheid</text>
        </g>

        {/* Card 3 — BOTTOM (subtieler) */}
        <g data-nieuws-card-3>
          <rect x="40" y="422" width="520" height="110" rx="14" fill="#fefdfb" stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.85" />

          <text x="70" y="453" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.55" fontWeight="700">JURISPRUDENTIE</text>
          <text x="70" y="485" fontSize="16" fill="rgb(11, 29, 58)" fontWeight="700">Hoge Raad: Deliveroo-kader bij interim</text>

          <circle cx="78" cy="512" r="3" fill="rgb(11, 29, 58)" opacity="0.4" />
          <text x="90" y="516" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.5">5 mei 2026 · Hoge Raad</text>
        </g>
      </svg>

      {/* Voor-decoraties */}
      <div
        data-nieuws-decor-4
        className="absolute -bottom-6 left-8 w-10 h-10 rounded-full bg-accent/35 z-0"
      />
      <div
        data-nieuws-decor-5
        className="absolute top-8 left-1/4 w-5 h-5 rounded-md bg-primary/25 rotate-45 hidden md:block z-0"
      />
    </div>
  );
}
