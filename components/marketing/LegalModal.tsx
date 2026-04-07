'use client'

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface LegalModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] } },
};

export default function LegalModal({ title, children, onClose }: LegalModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        variants={backdropVariants}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-2xl bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border/60 overflow-hidden max-h-[85vh] flex flex-col"
        variants={modalVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <h2 className="text-lg font-bold text-foreground pr-8" data-testid="legal-modal-title">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            data-testid="close-legal-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-ul:my-3 prose-li:my-0.5">
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
