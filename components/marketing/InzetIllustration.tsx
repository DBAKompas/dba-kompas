"use client";

export function InzetIllustration() {
  return (
    <div className="relative aspect-[4/5] w-full max-w-md mx-auto">
      {/* Decoraties achter de illustratie */}
      <div
        data-decor-1
        className="absolute -top-4 -left-8 w-20 h-20 rounded-full bg-accent/20"
      />
      <div
        data-decor-2
        className="absolute top-1/2 -right-12 w-32 h-32 rounded-full bg-primary/10 hidden md:block"
      />
      <div
        data-decor-3
        className="absolute bottom-12 -left-4 w-16 h-16 rounded-2xl bg-accent/30 rotate-12 hidden md:block"
      />

      {/* Hoofd-SVG illustratie */}
      <svg
        viewBox="0 0 400 500"
        className="relative w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        data-inzet-svg
      >
        {/* Document soft drop-shadow */}
        <rect
          x="68"
          y="88"
          width="280"
          height="380"
          rx="14"
          fill="rgb(11, 29, 58)"
          opacity="0.06"
          style={{ filter: "blur(8px)" }}
        />

        <g data-svg-doc>
          {/* Document body */}
          <rect
            x="60"
            y="80"
            width="280"
            height="380"
            rx="14"
            fill="#fefdfb"
            stroke="rgb(212, 120, 42)"
            strokeWidth="1.5"
            opacity="0.95"
          />

          {/* Header */}
          <line x1="90" y1="120" x2="200" y2="120" stroke="rgb(11, 29, 58)" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
          <line x1="90" y1="140" x2="150" y2="140" stroke="rgb(11, 29, 58)" strokeWidth="2" opacity="0.3" strokeLinecap="round" />

          {/* Body lines */}
          <line x1="90" y1="180" x2="310" y2="180" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <line x1="90" y1="195" x2="290" y2="195" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <line x1="90" y1="210" x2="310" y2="210" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

          {/* Highlight 1 */}
          <rect
            data-svg-highlight-1
            x="88"
            y="232"
            width="220"
            height="14"
            rx="3"
            fill="rgb(212, 120, 42)"
            opacity="0.25"
          />
          <line x1="90" y1="240" x2="310" y2="240" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />

          <line x1="90" y1="265" x2="280" y2="265" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <line x1="90" y1="280" x2="305" y2="280" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

          {/* Highlight 2 */}
          <rect
            data-svg-highlight-2
            x="88"
            y="302"
            width="170"
            height="14"
            rx="3"
            fill="rgb(212, 120, 42)"
            opacity="0.25"
          />
          <line x1="90" y1="310" x2="270" y2="310" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />

          <line x1="90" y1="335" x2="310" y2="335" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <line x1="90" y1="350" x2="240" y2="350" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <line x1="90" y1="365" x2="300" y2="365" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <line x1="90" y1="380" x2="220" y2="380" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

          {/* Signature */}
          <line x1="90" y1="420" x2="180" y2="420" stroke="rgb(11, 29, 58)" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
        </g>

        {/* Loep */}
        <g data-svg-loupe transform="translate(180 250) rotate(-12 80 80)">
          <circle cx="80" cy="80" r="70" fill="rgb(254, 253, 251)" opacity="0.4" />
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgb(11, 29, 58)" strokeWidth="5" />
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="1.5" opacity="0.7" />
          <ellipse cx="55" cy="55" rx="20" ry="14" fill="white" opacity="0.4" />
          <line x1="130" y1="130" x2="180" y2="180" stroke="rgb(11, 29, 58)" strokeWidth="8" strokeLinecap="round" />
          <line x1="135" y1="125" x2="180" y2="170" stroke="rgb(212, 120, 42)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </g>
      </svg>

      {/* Decoraties vóór de illustratie */}
      <div
        data-decor-4
        className="absolute -bottom-8 right-8 w-12 h-12 rounded-full bg-accent"
      />
      <div
        data-decor-5
        className="absolute top-4 right-1/4 w-6 h-6 rounded-md bg-primary/80 rotate-45 hidden md:block"
      />
    </div>
  );
}
