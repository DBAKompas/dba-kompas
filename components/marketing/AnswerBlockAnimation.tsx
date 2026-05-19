"use client";
import { useEffect, useRef, useState } from "react";

export function AnswerBlockAnimation({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayed(text);
      return;
    }

    let started = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          let i = 0;
          interval = setInterval(() => {
            i += 3;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
              setDisplayed(text);
              if (interval) clearInterval(interval);
            }
          }, 25);
        }
      },
      { threshold: 0.4 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [text]);

  return (
    <p
      ref={ref}
      className="mt-6 text-base md:text-lg leading-relaxed text-muted-foreground"
    >
      {displayed || " "}
    </p>
  );
}
