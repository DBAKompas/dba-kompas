'use client'

import { useState, useEffect, useRef, useCallback } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isClickable, setIsClickable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) {
      setIsTouch(true);
      return;
    }

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onEnter = () => setIsVisible(true);
    const onLeave = () => setIsVisible(false);

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [isVisible]);

  const checkClickable = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    const node = el.closest("a, button, [role='button'], input, textarea, select, [data-clickable], label[for]");
    if (node) return true;
    const style = window.getComputedStyle(el);
    return style.cursor === "pointer";
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      pos.current.x = lerp(pos.current.x, target.current.x, 0.35);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.35);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }

      setIsClickable(checkClickable(target.current.x, target.current.y));

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [isTouch, checkClickable]);

  if (isTouch) return null;

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${isClickable ? "custom-cursor--active" : ""} ${isVisible ? "custom-cursor--visible" : ""}`}
      data-testid="custom-cursor"
    />
  );
}
