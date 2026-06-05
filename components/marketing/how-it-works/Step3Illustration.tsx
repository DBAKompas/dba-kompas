"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function Step3Illustration() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.from("[data-s3-doc]", { opacity: 0, x: -30, duration: 0.6, ease: "power3.out" });

      gsap.fromTo(
        ["[data-s3-highlight-1]", "[data-s3-highlight-2]", "[data-s3-highlight-3]"],
        { opacity: 0 },
        {
          opacity: 0.25,
          duration: 0.4,
          stagger: 0.3,
          delay: 0.4,
          ease: "power2.out",
        },
      );

      gsap.from("[data-s3-check]", {
        scale: 0,
        opacity: 0,
        transformOrigin: "600px 240px",
        duration: 0.5,
        delay: 1.4,
        ease: "back.out(2)",
      });

      gsap.from("[data-s3-arrow]", {
        opacity: 0,
        x: -20,
        duration: 0.5,
        delay: 1.7,
        ease: "power2.out",
      });

      // Idle floating decoraties
      gsap.to("[data-s3-decor-1]", { y: -10, x: 6, duration: 4.5, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to("[data-s3-decor-2]", { y: 12, x: -8, duration: 5.5, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to("[data-s3-decor-3]", { y: -8, x: 10, duration: 5, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    return () => ctx.revert();
  });

  return (
    <svg
      viewBox="0 0 800 500"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Decoraties */}
      <path data-s3-decor-1 d="M 80 80 A 40 40 0 0 1 120 120" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="2" opacity="0.4" />
      <circle data-s3-decor-2 cx="730" cy="100" r="18" fill="rgb(212, 120, 42)" opacity="0.25" />
      <rect data-s3-decor-3 x="100" y="400" width="40" height="40" rx="6" fill="rgb(11, 29, 58)" opacity="0.1" transform="rotate(15 120 420)" />

      {/* Document */}
      <g data-s3-doc>
        <rect x="160" y="100" width="320" height="320" rx="14" fill="#fefdfb" stroke="rgb(212, 120, 42)" strokeWidth="1.5" />
        <line x1="190" y1="140" x2="320" y2="140" stroke="rgb(11, 29, 58)" strokeWidth="3" opacity="0.7" strokeLinecap="round" />

        <line x1="190" y1="180" x2="430" y2="180" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

        <rect data-s3-highlight-1 x="188" y="200" width="220" height="14" rx="3" fill="rgb(212, 120, 42)" opacity="0.25" />
        <line x1="190" y1="208" x2="430" y2="208" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />

        <line x1="190" y1="240" x2="400" y2="240" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

        <rect data-s3-highlight-2 x="188" y="260" width="180" height="14" rx="3" fill="rgb(212, 120, 42)" opacity="0.25" />
        <line x1="190" y1="268" x2="380" y2="268" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />

        <line x1="190" y1="300" x2="420" y2="300" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

        <rect data-s3-highlight-3 x="188" y="320" width="160" height="14" rx="3" fill="rgb(212, 120, 42)" opacity="0.25" />
        <line x1="190" y1="328" x2="360" y2="328" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />

        <line x1="190" y1="360" x2="410" y2="360" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line x1="190" y1="380" x2="320" y2="380" stroke="rgb(11, 29, 58)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      </g>

      {/* Check-circle */}
      <g data-s3-check transform="translate(560 200)">
        <circle cx="40" cy="40" r="38" fill="rgb(16, 185, 129)" />
        <path d="M 25 40 L 35 50 L 55 30" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Pijl naar voren */}
      <g data-s3-arrow opacity="0.8" transform="translate(560 320)">
        <line x1="0" y1="20" x2="80" y2="20" stroke="rgb(212, 120, 42)" strokeWidth="3" strokeLinecap="round" />
        <polyline points="60,0 80,20 60,40" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="0" y="62" fontSize="13" fill="rgb(11, 29, 58)" opacity="0.7" fontWeight="600">Volgende stap</text>
      </g>
    </svg>
  );
}
