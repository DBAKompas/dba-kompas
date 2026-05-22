"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function SegmentAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-segment-word]", { opacity: 0, y: 10 });
      gsap.set("[data-segment-body]", { opacity: 0, y: 8 });
      gsap.set("[data-segment-card]", { opacity: 0, y: 30 });
      gsap.set("[data-segment-step]", { opacity: 0, x: -20 });
      gsap.set("[data-segment-faq-item]", { opacity: 0, y: 16 });

      gsap.to("[data-segment-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
      });
      gsap.to("[data-segment-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
      });

      const inViewStagger = (sel: string, opts: gsap.TweenVars = {}) => {
        gsap.to(sel, {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: sel, start: "top 90%", once: true },
          ...opts,
        });
      };

      inViewStagger("[data-segment-card]");
      inViewStagger("[data-segment-step]", { duration: 0.5, stagger: 0.1 });
      inViewStagger("[data-segment-faq-item]", { duration: 0.5, stagger: 0.08 });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
