"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function PrijsAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-prijs-callout]", { opacity: 0, y: 20 });

      gsap.to("[data-prijs-callout]", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-prijs-callouts]", start: "top 85%", once: true },
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
