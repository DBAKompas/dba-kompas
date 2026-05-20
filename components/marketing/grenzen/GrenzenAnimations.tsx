"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function GrenzenAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-grenzen-word]", { opacity: 0, y: 12 });
      gsap.set("[data-grenzen-word-body]", { opacity: 0, y: 8 });
      gsap.set("[data-grenzen-card]", { opacity: 0, y: 30 });

      gsap.to("[data-grenzen-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-grenzen-grid]", start: "top 90%", once: true },
      });
      gsap.to("[data-grenzen-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-grenzen-grid]", start: "top 90%", once: true },
      });
      gsap.to("[data-grenzen-card]", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.5,
        scrollTrigger: { trigger: "[data-grenzen-grid]", start: "top 90%", once: true },
      });

      gsap.to("[data-indicatief-needle]", {
        rotation: -5,
        transformOrigin: "60px 65px",
        svgOrigin: "60 65",
        duration: 2.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
