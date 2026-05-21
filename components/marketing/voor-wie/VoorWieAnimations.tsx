"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function VoorWieAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-voorwie-word]", { opacity: 0, y: 12 });
      gsap.set("[data-voorwie-word-body]", { opacity: 0, y: 8 });
      gsap.set("[data-voorwie-card]", { opacity: 0, y: 30 });

      gsap.to("[data-voorwie-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-voorwie-grid]", start: "top 90%", once: true },
      });
      gsap.to("[data-voorwie-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-voorwie-grid]", start: "top 90%", once: true },
      });
      gsap.to("[data-voorwie-card]", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5,
        scrollTrigger: { trigger: "[data-voorwie-grid]", start: "top 90%", once: true },
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
