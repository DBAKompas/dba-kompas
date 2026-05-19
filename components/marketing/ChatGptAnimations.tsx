"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function ChatGptAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      // Word-stagger op H2 en intro
      gsap.set("[data-chatgpt-word]", { opacity: 0, y: 12 });
      gsap.set("[data-chatgpt-word-body]", { opacity: 0, y: 8 });
      gsap.to("[data-chatgpt-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 85%", once: true },
      });
      gsap.to("[data-chatgpt-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 85%", once: true },
      });

      // Header row fade-down
      gsap.from("[data-chatgpt-table-header]", {
        opacity: 0,
        y: -10,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.4,
        scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 80%", once: true },
      });

      // Rijen staggered van onder
      gsap.from("[data-chatgpt-row]", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.12,
        ease: "power2.out",
        delay: 0.6,
        scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 75%", once: true },
      });

      // Cell-words subtle fade-in
      gsap.set("[data-chatgpt-cell-word]", { opacity: 0, y: 4 });
      gsap.to("[data-chatgpt-cell-word]", {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.008,
        ease: "power2.out",
        delay: 0.8,
        scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 75%", once: true },
      });

      // Icoontjes pop-in
      gsap.from("[data-chatgpt-icon-cross]", {
        opacity: 0,
        scale: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.9,
        transformOrigin: "center",
        scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 75%", once: true },
      });
      gsap.from("[data-chatgpt-icon-check]", {
        opacity: 0,
        scale: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(2)",
        delay: 1,
        transformOrigin: "center",
        scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 75%", once: true },
      });

      // Decoraties: entry + parallax + idle x-float
      [1, 2, 3, 4].forEach((i, idx) => {
        gsap.from(`[data-chatgpt-decor-${i}]`, {
          opacity: 0,
          scale: 0,
          duration: 0.7,
          ease: "back.out(1.7)",
          delay: 0.2 + idx * 0.08,
          scrollTrigger: { trigger: "[data-chatgpt-table-wrap]", start: "top 80%", once: true },
        });

        const speed = 1.2 + idx * 0.15;
        gsap.to(`[data-chatgpt-decor-${i}]`, {
          y: () => -(window.innerHeight * 0.35 * speed),
          ease: "none",
          scrollTrigger: {
            trigger: "[data-chatgpt-table-wrap]",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });

        gsap.to(`[data-chatgpt-decor-${i}]`, {
          x: idx % 2 === 0 ? 8 : -6,
          duration: 4 + idx * 0.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // Continue accent-glow puls op DBA-kolom
      gsap.to("[data-chatgpt-glow]", {
        opacity: 0.55,
        duration: 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
    return () => ctx.revert();
  });
  return null;
}
