"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function HeroAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-h1] > span", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.2,
      });
      gsap.from("[data-hero-subhead]", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.6,
      });
      gsap.from("[data-hero-cta]", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.8,
      });
      gsap.from("[data-hero-mockup]", {
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: "power3.out",
        delay: 0.4,
      });
      gsap.to("[data-hero-mockup]", {
        y: -50,
        scrollTrigger: {
          trigger: "[data-hero-mockup]",
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });
      gsap.to("[data-hero-bg] > div", {
        y: 100,
        scrollTrigger: {
          trigger: "[data-hero-bg]",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  });
  return null;
}
