"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackFaqOpened } from "@/lib/dba-analytics";

type FaqItem = { question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3 max-w-3xl mx-auto" data-faq-list>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            data-faq-item
            className={`relative rounded-xl ring-1 transition-all duration-300 overflow-hidden ${
              isOpen
                ? "bg-card ring-accent/30 shadow-md"
                : "bg-transparent ring-foreground/10 hover:bg-card/50 hover:ring-foreground/20"
            }`}
          >
            {isOpen && (
              <motion.div
                layoutId="faq-accent"
                className="absolute left-0 top-0 bottom-0 w-1 bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <button
              type="button"
              onClick={() => {
                const next = isOpen ? null : i;
                if (!isOpen) trackFaqOpened(item.question, "landing");
                setOpenIndex(next);
              }}
              className="w-full px-5 md:px-7 py-5 flex items-center justify-between gap-4 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={`text-base md:text-lg font-semibold transition-colors ${
                  isOpen ? "text-foreground" : "text-foreground/85"
                }`}
              >
                {item.question}
              </span>

              <motion.span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isOpen ? "bg-accent text-white" : "bg-foreground/5 text-foreground/60"
                }`}
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 5 L7 9 L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-5 md:px-7 pb-5 md:pb-6 text-base text-muted-foreground leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
