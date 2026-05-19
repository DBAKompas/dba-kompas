"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function Step2Illustration() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      // Pulse-cirkels radar-effect
      gsap.fromTo(
        "[data-s2-pulse-1]",
        { opacity: 0.05 },
        { opacity: 0.25, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true },
      );
      gsap.fromTo(
        "[data-s2-pulse-2]",
        { opacity: 0.1 },
        { opacity: 0.4, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 0.5 },
      );
      gsap.fromTo(
        "[data-s2-pulse-3]",
        { opacity: 0.2 },
        { opacity: 0.55, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1 },
      );

      // Kompas entry
      gsap.from("[data-s2-compass]", { scale: 0.6, opacity: 0, transformOrigin: "400px 250px", duration: 0.8, ease: "power3.out" });

      // Naald continu draaien rond kompas-center (SVG-coordinaten)
      gsap.to("[data-s2-needle]", {
        rotation: 360,
        svgOrigin: "400 250",
        duration: 12,
        ease: "none",
        repeat: -1,
      });

      // Drie punten staggered fade-in + subtle pulse
      gsap.from(["[data-s2-point-1]", "[data-s2-point-2]", "[data-s2-point-3]"], {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        delay: 0.8,
        ease: "back.out(2)",
        transformOrigin: "center center",
      });
      gsap.from(["[data-s2-label-1]", "[data-s2-label-2]", "[data-s2-label-3]"], {
        opacity: 0,
        duration: 0.4,
        stagger: 0.2,
        delay: 1.1,
        ease: "power2.out",
      });

      // Idle decoraties
      gsap.to("[data-s2-decor-1]", { y: -10, x: 8, duration: 4.5, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to("[data-s2-decor-2]", { y: 12, x: -8, duration: 5.5, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to("[data-s2-decor-3]", { y: -8, x: -10, duration: 5, ease: "sine.inOut", repeat: -1, yoyo: true });
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
      <circle data-s2-decor-1 cx="100" cy="80" r="20" fill="rgb(212, 120, 42)" opacity="0.3" />
      <rect data-s2-decor-2 x="680" y="100" width="40" height="40" rx="8" fill="rgb(11, 29, 58)" opacity="0.1" />
      <circle data-s2-decor-3 cx="720" cy="400" r="14" fill="rgb(212, 120, 42)" opacity="0.4" />

      {/* Pulserende radar-cirkels */}
      <circle data-s2-pulse-1 cx="400" cy="250" r="180" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="1.5" />
      <circle data-s2-pulse-2 cx="400" cy="250" r="140" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="1.5" />
      <circle data-s2-pulse-3 cx="400" cy="250" r="100" fill="none" stroke="rgb(212, 120, 42)" strokeWidth="1.5" />

      {/* Kompas */}
      <g data-s2-compass>
        <circle cx="400" cy="250" r="70" fill="#fefdfb" stroke="rgb(11, 29, 58)" strokeWidth="2" />
        <circle cx="400" cy="250" r="60" fill="none" stroke="rgb(11, 29, 58)" strokeWidth="0.5" opacity="0.4" />
        <line x1="400" y1="185" x2="400" y2="195" stroke="rgb(11, 29, 58)" strokeWidth="2" />
        <line x1="400" y1="305" x2="400" y2="315" stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.6" />
        <line x1="335" y1="250" x2="345" y2="250" stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.6" />
        <line x1="455" y1="250" x2="465" y2="250" stroke="rgb(11, 29, 58)" strokeWidth="1" opacity="0.6" />

        <g data-s2-needle>
          <polygon points="400,205 408,250 400,255 392,250" fill="rgb(212, 120, 42)" />
          <polygon points="400,295 408,250 400,245 392,250" fill="rgb(11, 29, 58)" opacity="0.5" />
        </g>
        <circle cx="400" cy="250" r="5" fill="rgb(11, 29, 58)" />
      </g>

      {/* Drie kernpunten in baan */}
      <circle data-s2-point-1 cx="500" cy="250" r="9" fill="rgb(212, 120, 42)" />
      <circle data-s2-point-2 cx="350" cy="336" r="9" fill="rgb(212, 120, 42)" />
      <circle data-s2-point-3 cx="350" cy="164" r="9" fill="rgb(212, 120, 42)" />

      <text data-s2-label-1 x="520" y="255" fontSize="13" fill="rgb(11, 29, 58)" opacity="0.7" fontWeight="600">Gezag</text>
      <text data-s2-label-2 x="240" y="340" fontSize="13" fill="rgb(11, 29, 58)" opacity="0.7" fontWeight="600">Risico</text>
      <text data-s2-label-3 x="180" y="168" fontSize="13" fill="rgb(11, 29, 58)" opacity="0.7" fontWeight="600">Ondernemerschap</text>
    </svg>
  );
}
