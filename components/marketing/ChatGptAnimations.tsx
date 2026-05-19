"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function ChatGptAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-chatgpt-word]", { opacity: 0, y: 12 });
      gsap.set("[data-chatgpt-word-body]", { opacity: 0, y: 8 });

      gsap.to("[data-chatgpt-word]", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-chatgpt-grid]", start: "top 80%", once: true },
      });
      gsap.to("[data-chatgpt-word-body]", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.012,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: "[data-chatgpt-grid]", start: "top 80%", once: true },
      });

      gsap.from("[data-chatgpt-col-left]", {
        opacity: 0,
        x: -50,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.5,
        scrollTrigger: { trigger: "[data-chatgpt-grid]", start: "top 75%", once: true },
      });
      gsap.from("[data-chatgpt-col-right]", {
        opacity: 0,
        x: 50,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.7,
        scrollTrigger: { trigger: "[data-chatgpt-grid]", start: "top 75%", once: true },
      });
    });
    return () => ctx.revert();
  });
  return null;
}
