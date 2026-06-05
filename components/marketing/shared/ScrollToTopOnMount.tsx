"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTopOnMount() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return; // anchor-navigatie respecteren
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
