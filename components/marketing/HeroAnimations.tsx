"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function HeroAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      // Initial reveal-animaties
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

      // Scroll-parallax mockup en achtergrond
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

      // Continu langzaam bewegende achtergrond-mesh (B)
      gsap.to("[data-hero-bg] > div.bg-mesh-a", {
        xPercent: 8,
        yPercent: 4,
        duration: 30,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to("[data-hero-bg] > div.bg-mesh-b", {
        xPercent: -6,
        yPercent: -3,
        duration: 42,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Floating notification-cards (A): staggered loop
      const cards = gsap.utils.toArray<HTMLElement>("[data-hero-notif]");
      cards.forEach((card, i) => {
        gsap.set(card, { opacity: 0, y: 20 });
        const tl = gsap.timeline({ repeat: -1, delay: 1.5 + i * 2 });
        tl.to(card, { opacity: 1, y: 0, duration: 1, ease: "power2.out" })
          .to(card, { opacity: 1, duration: 4.5 })
          .to(card, { opacity: 0, y: -20, duration: 0.8, ease: "power2.in" })
          .to(card, { duration: 15 - 5.8 - i * 0 });
      });
    });
    return () => ctx.revert();
  });
  return null;
}
