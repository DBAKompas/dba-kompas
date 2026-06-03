"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function ResultaatAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-resultaat-word]", { opacity: 0, y: 12 });
      gsap.set("[data-resultaat-word-body]", { opacity: 0, y: 8 });
      gsap.set("[data-grenzen-word]", { opacity: 0, y: 12 });
      gsap.set("[data-resultaat-item]", { opacity: 0, x: -20 });
      gsap.set("[data-grenzen-item]", { opacity: 0, x: 20 });

      gsap.to("[data-resultaat-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-resultaat-text]", start: "top 85%", once: true },
      });
      gsap.to("[data-resultaat-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-resultaat-text]", start: "top 85%", once: true },
      });
      gsap.to("[data-resultaat-item]", {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.5,
        scrollTrigger: { trigger: "[data-resultaat-text]", start: "top 80%", once: true },
      });

      gsap.to("[data-grenzen-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        delay: 0.2,
        scrollTrigger: { trigger: "[data-grenzen-block]", start: "top 85%", once: true },
      });
      gsap.to("[data-grenzen-item]", {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.6,
        scrollTrigger: { trigger: "[data-grenzen-block]", start: "top 80%", once: true },
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
