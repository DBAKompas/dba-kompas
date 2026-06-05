"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function OverAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      const wordSelectors = [
        "[data-over-hero-word]",
        "[data-over-hero-body]",
        "[data-over-maker-word]",
        "[data-over-maker-body]",
        "[data-over-methodiek-word]",
        "[data-over-methodiek-body]",
      ];

      wordSelectors.forEach((sel) => {
        gsap.set(sel, { opacity: 0, y: 10 });
      });
      gsap.set("[data-over-circle]", { opacity: 0, scale: 0 });
      gsap.set("[data-over-list-item]", { opacity: 0, x: -20 });
      gsap.set("[data-over-bron-card]", { opacity: 0, y: 20 });

      gsap.to("[data-over-hero-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
      });
      gsap.to("[data-over-hero-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.4,
      });

      const triggerStagger = (trigger: string, selector: string, opts: gsap.TweenVars = {}) => {
        gsap.to(selector, {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          scrollTrigger: { trigger, start: "top 85%", once: true },
          ...opts,
        });
      };

      triggerStagger("[data-over-maker-word]", "[data-over-maker-word]");
      triggerStagger("[data-over-maker-word]", "[data-over-maker-body]", {
        stagger: 0.012,
        duration: 0.4,
        delay: 0.3,
      });

      triggerStagger("[data-over-methodiek-word]", "[data-over-methodiek-word]");
      triggerStagger("[data-over-methodiek-word]", "[data-over-methodiek-body]", {
        stagger: 0.012,
        duration: 0.4,
        delay: 0.3,
      });

      gsap.to("[data-over-circle]", {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.2,
        ease: "back.out(1.7)",
        transformOrigin: "center center",
        scrollTrigger: { trigger: "[data-over-circles]", start: "top 85%", once: true },
      });

      gsap.to("[data-over-list-item]", {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-over-list-item]", start: "top 85%", once: true },
      });

      gsap.to("[data-over-bron-card]", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-over-bron-grid]", start: "top 85%", once: true },
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
