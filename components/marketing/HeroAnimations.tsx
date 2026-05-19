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

      // Entry: laptop komt dicht (lid gevouwen) en roterend binnen,
      // klapt tijdens binnenvliegen open
      gsap.set("[data-laptop-stage]", {
        x: 180,
        y: 40,
        scale: 0.65,
        rotateY: 35,
        rotateZ: -8,
        opacity: 0,
        transformOrigin: "center center",
      });
      gsap.set("[data-laptop-lid]", { rotateX: -100 });

      const laptopTl = gsap.timeline({ delay: 0.4 });
      laptopTl
        .to("[data-laptop-stage]", {
          x: 0,
          y: 0,
          scale: 1,
          rotateY: 0,
          rotateZ: 0,
          opacity: 1,
          duration: 1.4,
          ease: "power3.out",
        })
        .to(
          "[data-laptop-lid]",
          {
            rotateX: 0,
            duration: 1.1,
            ease: "power2.out",
          },
          "-=0.8",
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
