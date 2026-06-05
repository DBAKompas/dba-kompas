"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function KennisbankAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-kennisbank-word]", { opacity: 0, y: 10 });
      gsap.set("[data-kennisbank-section]", { opacity: 0, y: 16 });
      gsap.set("[data-kennisbank-related]", { opacity: 0, y: 20 });

      gsap.to("[data-kennisbank-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
      });

      gsap.to("[data-kennisbank-section]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-kennisbank-section]", start: "top 90%", once: true },
      });

      gsap.to("[data-kennisbank-related]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-kennisbank-related]", start: "top 90%", once: true },
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
