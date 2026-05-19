"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function InzetAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      // Word-stagger op tekst
      gsap.set("[data-inzet-word]", { opacity: 0, y: 12 });
      gsap.set("[data-inzet-word-body]", { opacity: 0, y: 8 });

      gsap.to("[data-inzet-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-inzet-text]", start: "top 75%", once: true },
      });
      gsap.to("[data-inzet-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-inzet-text]", start: "top 75%", once: true },
      });

      // SVG fade-in en scale
      gsap.set("[data-inzet-svg]", { opacity: 0, scale: 0.9, transformOrigin: "center center" });
      gsap.to("[data-inzet-svg]", {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-inzet-visual]", start: "top 80%", once: true },
      });

      // Loep entrance
      gsap.set("[data-svg-loupe]", { opacity: 0 });
      gsap.to("[data-svg-loupe]", {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.4,
        scrollTrigger: { trigger: "[data-inzet-visual]", start: "top 80%", once: true },
      });

      // Highlights lichten op
      gsap.fromTo(
        ["[data-svg-highlight-1]", "[data-svg-highlight-2]"],
        { opacity: 0 },
        {
          opacity: 0.25,
          duration: 0.5,
          stagger: 0.3,
          delay: 0.8,
          scrollTrigger: { trigger: "[data-inzet-visual]", start: "top 70%", once: true },
        },
      );

      // Decoraties entry (pop-in)
      gsap.from(
        [
          "[data-decor-1]",
          "[data-decor-2]",
          "[data-decor-3]",
          "[data-decor-4]",
          "[data-decor-5]",
        ],
        {
          opacity: 0,
          scale: 0,
          duration: 0.7,
          ease: "back.out(1.7)",
          stagger: 0.08,
          delay: 0.2,
          scrollTrigger: { trigger: "[data-inzet-visual]", start: "top 80%", once: true },
        },
      );

      // Decoraties idle floating (continu)
      [1, 2, 3, 4, 5].forEach((i, idx) => {
        gsap.to(`[data-decor-${i}]`, {
          y: idx % 2 === 0 ? -15 : 12,
          x: idx % 3 === 0 ? 8 : -6,
          duration: 4 + idx * 0.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // Loep zacht zweven
      gsap.to("[data-svg-loupe]", {
        x: 8,
        y: -5,
        duration: 5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1.5,
      });
    });
    return () => ctx.revert();
  });
  return null;
}
