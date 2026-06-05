"use client";
import { useGsap } from "@/lib/animations/useGsap";

export function MethodiekAnimations() {
  useGsap((gsap) => {
    const ctx = gsap.context(() => {
      gsap.set("[data-methodiek-circle]", { opacity: 0, scale: 0 });
      gsap.set("[data-methodiek-line-1]", { strokeDashoffset: 300 });
      gsap.set("[data-methodiek-line-2]", { strokeDashoffset: 300 });
      gsap.set("[data-methodiek-block] h3, [data-methodiek-block] p", {
        opacity: 0,
        y: 10,
      });

      gsap.to("[data-methodiek-circle]", {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.2,
        ease: "back.out(1.7)",
        transformOrigin: "center center",
        scrollTrigger: { trigger: "[data-methodiek-kernpunten]", start: "top 85%", once: true },
      });

      gsap.to("[data-methodiek-line-1]", {
        strokeDashoffset: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.4,
        scrollTrigger: { trigger: "[data-methodiek-kernpunten]", start: "top 85%", once: true },
      });
      gsap.to("[data-methodiek-line-2]", {
        strokeDashoffset: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.7,
        scrollTrigger: { trigger: "[data-methodiek-kernpunten]", start: "top 85%", once: true },
      });

      gsap.to("[data-methodiek-block] h3, [data-methodiek-block] p", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.6,
        scrollTrigger: { trigger: "[data-methodiek-kernpunten]", start: "top 85%", once: true },
      });

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    });
    return () => ctx.revert();
  });
  return null;
}
