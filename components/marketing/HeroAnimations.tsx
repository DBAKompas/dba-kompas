"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function HeroAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      // Entry: linker kolom vanuit links
      gsap.from("[data-hero-eyebrow]", {
        x: -40,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
      });
      gsap.from("[data-hero-h1] > span", {
        x: -60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.15,
      });
      gsap.from("[data-hero-subhead]", {
        x: -40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.5,
      });
      gsap.from("[data-hero-cta]", {
        x: -40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.7,
      });

      // Entry: scherm vliegt al draaiend in van rechts, eerst achterkant,
      // draait naar voorkant tijdens binnenkomst
      gsap.set("[data-laptop-stage]", {
        x: 220,
        y: 30,
        scale: 0.75,
        opacity: 0,
      });
      gsap.set("[data-screen-flipper]", {
        rotateY: -200,
        transformOrigin: "center center",
      });

      const flipTl = gsap.timeline({ delay: 0.4 });
      flipTl
        .to("[data-laptop-stage]", {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.3,
          ease: "power3.out",
        })
        .to(
          "[data-screen-flipper]",
          {
            rotateY: 0,
            duration: 1.5,
            ease: "power2.out",
          },
          "<",
        );

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

      // Continu langzaam bewegende achtergrond-mesh
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
    });
    return () => ctx.revert();
  });
  return null;
}
