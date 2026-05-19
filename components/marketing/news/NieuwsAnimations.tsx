"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function NieuwsAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      // Tekst word-stagger
      gsap.set("[data-nieuws-word]", { opacity: 0, y: 12 });
      gsap.set("[data-nieuws-word-body]", { opacity: 0, y: 8 });
      gsap.to("[data-nieuws-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-nieuws-text]", start: "top 75%", once: true },
      });
      gsap.to("[data-nieuws-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-nieuws-text]", start: "top 75%", once: true },
      });

      // Cards staggered van rechts
      gsap.set(["[data-nieuws-card-1]", "[data-nieuws-card-2]", "[data-nieuws-card-3]"], {
        opacity: 0,
        x: 40,
      });
      gsap.to("[data-nieuws-card-1]", {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.2,
        scrollTrigger: { trigger: "[data-nieuws-visual]", start: "top 80%", once: true },
      });
      gsap.to("[data-nieuws-card-2]", {
        opacity: 0.85,
        x: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.4,
        scrollTrigger: { trigger: "[data-nieuws-visual]", start: "top 80%", once: true },
      });
      gsap.to("[data-nieuws-card-3]", {
        opacity: 0.7,
        x: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.6,
        scrollTrigger: { trigger: "[data-nieuws-visual]", start: "top 80%", once: true },
      });

      // Pulserende ring rond top-card
      gsap.to("[data-nieuws-pulse]", {
        opacity: 0.15,
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1.5,
      });

      // Decoraties entry
      gsap.from(
        [
          "[data-nieuws-decor-1]",
          "[data-nieuws-decor-2]",
          "[data-nieuws-decor-3]",
          "[data-nieuws-decor-4]",
          "[data-nieuws-decor-5]",
        ],
        {
          opacity: 0,
          scale: 0,
          duration: 0.7,
          ease: "back.out(1.7)",
          stagger: 0.08,
          delay: 0.2,
          scrollTrigger: { trigger: "[data-nieuws-visual]", start: "top 80%", once: true },
        },
      );

      // Scroll-driven parallax + fade-out per decoratie
      [1, 2, 3, 4, 5].forEach((i, idx) => {
        const speed = 1.2 + idx * 0.15;
        gsap.to(`[data-nieuws-decor-${i}]`, {
          y: () => -(window.innerHeight * 0.4 * speed),
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-nieuws-visual]",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      });
    });
    return () => ctx.revert();
  });
  return null;
}
