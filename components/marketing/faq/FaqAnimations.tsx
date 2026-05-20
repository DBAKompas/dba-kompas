"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function FaqAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-faq-word]", { opacity: 0, y: 12 });

      gsap.to("[data-faq-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-faq-list]", start: "top 85%", once: true },
      });

      gsap.from("[data-faq-item]", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-faq-list]", start: "top 85%", once: true },
      });
    });
    return () => ctx.revert();
  });
  return null;
}
