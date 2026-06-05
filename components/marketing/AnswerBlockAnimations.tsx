"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function AnswerBlockAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-answer-word]", { opacity: 0, y: 12 });
      gsap.set("[data-answer-word-body]", { opacity: 0, y: 8 });
      gsap.set("[data-answer-stats] > div", { opacity: 0, y: 20, scale: 0.95 });

      gsap.to("[data-answer-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-answer-text]",
          start: "top 75%",
          once: true,
        },
      });

      gsap.to("[data-answer-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.015,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: {
          trigger: "[data-answer-text]",
          start: "top 75%",
          once: true,
        },
      });

      gsap.to("[data-answer-stats] > div", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-answer-stats]",
          start: "top 80%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  });
  return null;
}
