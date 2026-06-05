"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function ResultaatAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-resultaat-word]", { opacity: 0, y: 12 });
      gsap.set("[data-resultaat-word-body]", { opacity: 0, y: 8 });
      gsap.set("[data-resultaat-tile]", { opacity: 0, y: 30 });
      gsap.set("[data-grenzen-item]", { opacity: 0, x: -10 });

      gsap.to("[data-resultaat-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-resultaat-tiles]", start: "top 85%", once: true },
      });
      gsap.to("[data-resultaat-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-resultaat-tiles]", start: "top 85%", once: true },
      });
      gsap.to("[data-resultaat-tile]", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.5,
        scrollTrigger: { trigger: "[data-resultaat-tiles]", start: "top 80%", once: true },
      });
      gsap.to("[data-grenzen-item]", {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-grenzen-strook]", start: "top 90%", once: true },
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
