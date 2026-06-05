"use client";
import { useEffect } from "react";

type GsapCallback = (gsap: typeof import("gsap").default) => void | (() => void);

export function useGsap(callback: GsapCallback) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: void | (() => void);
    let cancelled = false;

    import("gsap").then(({ default: gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        cleanup = callback(gsap);
      });
    });

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
