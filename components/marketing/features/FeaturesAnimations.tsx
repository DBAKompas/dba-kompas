"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function FeaturesAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-features-word]", { opacity: 0, y: 12 });
      gsap.set("[data-features-word-body]", { opacity: 0, y: 8 });
      gsap.set("[data-feature-card]", { opacity: 0, y: 30 });

      gsap.to("[data-features-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-features-grid]", start: "top 90%", once: true },
      });
      gsap.to("[data-features-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-features-grid]", start: "top 90%", once: true },
      });

      gsap.to("[data-feature-card]", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.4,
        scrollTrigger: { trigger: "[data-features-grid]", start: "top 90%", once: true },
      });

      // Force trigger evaluation against actual layout positions
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
