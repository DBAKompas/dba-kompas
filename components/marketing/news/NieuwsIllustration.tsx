"use client";

export function NieuwsIllustration() {
  return (
    <div className="relative aspect-[4/5] w-full max-w-md mx-auto" data-nieuws-visual>
      {/* Decoraties achter */}
      <div
        data-nieuws-decor-1
        className="absolute -top-4 -right-6 w-20 h-20 rounded-full bg-accent/20"
      />
      <div
        data-nieuws-decor-2
        className="absolute top-1/3 -left-10 w-28 h-28 rounded-full bg-primary/10 hidden md:block"
      />
      <div
        data-nieuws-decor-3
        className="absolute bottom-8 -right-4 w-16 h-16 rounded-2xl bg-accent/25 rotate-12 hidden md:block"
      />

      {/* SVG hoofd-mockup */}
      <svg
        viewBox="0 0 600 700"
        className="relative w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Feed-header */}
        <line x1="50" y1="40" x2="120" y2="40" stroke="rgb(212, 120, 42)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <text x="50" y="70" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.6" fontWeight="700">NIEUWS FEED</text>

        {/* Card 1 — TOP (oranje accent) */}
        <g data-nieuws-card-1>
          <rect x="44" y="104" width="520" height="170" rx="14" fill="rgb(11, 29, 58)" opacity="0.05" />
          <rect x="40" y="100" width="520" height="170" rx="14" fill="#fefdfb" stroke="rgb(212, 120, 42)" strokeWidth="2" />

          <rect x="70" y="125" width="78" height="22" rx="11" fill="rgb(212, 120, 42)" />
          <text x="109" y="141" fontSize="11" fill="white" fontWeight="700" textAnchor="middle">NIEUW</text>

          <text x="160" y="141" fontSize="11" fill="rgb(212, 120, 42)" fontWeight="600">Wetgeving · Handhaving</text>

          <text x="70" y="180" fontSize="18" fill="rgb(11, 29, 58)" fontWeight="700">Handhaving Wet DBA: actuele stand</text>

          <line x1="70" y1="205" x2="510" y2="205" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <line x1="70" y1="222" x2="430" y2="222" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />

          <circle cx="78" cy="252" r="3" fill="rgb(11, 29, 58)" opacity="0.4" />
          <text x="90" y="256" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.55">19 mei 2026 · Belastingdienst</text>

          {/* Pulserende ring */}
          <rect
            data-nieuws-pulse
            x="40"
            y="100"
            width="520"
            height="170"
            rx="14"
            fill="none"
            stroke="rgb(212, 120, 42)"
            strokeWidth="2"
            opacity="0.5"
          />
        </g>

        {/* Card 2 — MIDDLE */}
        <g data-nieuws-card-2>
          <rect x="40" y="295" width="520" height="170" rx="14" fill="#fefdfb" stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.85" />

          <text x="70" y="335" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.6" fontWeight="700">WETSVOORSTEL</text>
          <text x="70" y="370" fontSize="17" fill="rgb(11, 29, 58)" fontWeight="700">Zelfstandigenwet: stand van voortgang</text>

          <line x1="70" y1="395" x2="510" y2="395" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
          <line x1="70" y1="412" x2="460" y2="412" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />

          <circle cx="78" cy="442" r="3" fill="rgb(11, 29, 58)" opacity="0.4" />
          <text x="90" y="446" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.55">12 mei 2026 · Rijksoverheid</text>
        </g>

        {/* Card 3 — BOTTOM (subtieler) */}
        <g data-nieuws-card-3>
          <rect x="40" y="490" width="520" height="170" rx="14" fill="#fefdfb" stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.85" />

          <text x="70" y="530" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.55" fontWeight="700">JURISPRUDENTIE</text>
          <text x="70" y="565" fontSize="17" fill="rgb(11, 29, 58)" fontWeight="700">Hoge Raad: Deliveroo-kader bij interim</text>

          <line x1="70" y1="590" x2="510" y2="590" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <line x1="70" y1="607" x2="440" y2="607" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

          <circle cx="78" cy="637" r="3" fill="rgb(11, 29, 58)" opacity="0.4" />
          <text x="90" y="641" fontSize="11" fill="rgb(11, 29, 58)" opacity="0.5">5 mei 2026 · Hoge Raad</text>
        </g>
      </svg>

      {/* Voor-decoraties */}
      <div
        data-nieuws-decor-4
        className="absolute -bottom-6 left-8 w-10 h-10 rounded-full bg-accent"
      />
      <div
        data-nieuws-decor-5
        className="absolute top-8 left-1/4 w-5 h-5 rounded-md bg-primary/80 rotate-45 hidden md:block"
      />
    </div>
  );
}
