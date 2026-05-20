"use client";
import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/animations/useGsap";

export function SlotAnimations() {
  const ctaRef = useRef<HTMLElement | null>(null);

  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-slot-word]", { opacity: 0, y: 12 });
      gsap.set("[data-slot-word-body]", { opacity: 0, y: 8 });
      gsap.set("[data-slot-cta-wrap]", { opacity: 0, scale: 0.9 });

      gsap.to("[data-slot-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-slot-bg]", start: "top 85%", once: true },
      });
      gsap.to("[data-slot-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-slot-bg]", start: "top 85%", once: true },
      });
      gsap.to("[data-slot-cta-wrap]", {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.5)",
        delay: 0.8,
        scrollTrigger: { trigger: "[data-slot-bg]", start: "top 85%", once: true },
      });

      // Mesh-blobs continu beweging
      gsap.to("[data-slot-mesh] > div:nth-child(1)", {
        x: 60,
        y: -40,
        duration: 12,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to("[data-slot-mesh] > div:nth-child(2)", {
        x: -50,
        y: 30,
        duration: 14,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Kompas-naald continu roteren
      gsap.to("[data-slot-needle]", {
        rotation: 360,
        duration: 60,
        ease: "none",
        repeat: -1,
        svgOrigin: "100 100",
      });

      // Decoratie-dots zweven
      [1, 2, 3, 4].forEach((i, idx) => {
        gsap.to(`[data-slot-decor-${i}]`, {
          y: idx % 2 === 0 ? -12 : 10,
          x: idx % 3 === 0 ? 8 : -6,
          duration: 4 + idx * 0.7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    });
    return () => ctx.revert();
  });

  // Magnetic CTA-hover (apart effect, niet binnen useGsap-context omdat
  // het event-listeners gebruikt en geen scroll-trigger)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cta = document.querySelector<HTMLElement>("[data-slot-cta]");
    if (!cta) return;
    ctaRef.current = cta;

    let cleanup: (() => void) | undefined;
    import("gsap").then(({ default: gsap }) => {
      const handleMove = (e: MouseEvent) => {
        const rect = cta.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(cta, { x: x * 0.2, y: y * 0.2, duration: 0.4, ease: "power2.out" });
      };
      const handleLeave = () => {
        gsap.to(cta, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      };
      cta.addEventListener("mousemove", handleMove);
      cta.addEventListener("mouseleave", handleLeave);
      cleanup = () => {
        cta.removeEventListener("mousemove", handleMove);
        cta.removeEventListener("mouseleave", handleLeave);
      };
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}
