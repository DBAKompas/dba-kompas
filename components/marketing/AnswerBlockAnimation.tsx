"use client";
import { useEffect, useRef, useState } from "react";

export function AnswerBlockAnimation({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayed(text);
      setStarted(true);
      return;
    }

    let hasStarted = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          hasStarted = true;
          setStarted(true);
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
      {displayed || " "}
      {started && (
        <span className="inline-block ml-[1px] w-[2px] h-[1em] align-middle bg-accent animate-pulse" />
      )}
    </p>
  );
}
