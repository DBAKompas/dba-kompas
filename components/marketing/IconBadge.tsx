'use client'

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "accent" | "neutral";
type Size = "sm" | "md" | "lg";

interface IconBadgeProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const sizeMap: Record<Size, { wrapper: string; icon: string }> = {
  sm: { wrapper: "w-9 h-9 rounded-lg", icon: "[&>svg]:w-4 [&>svg]:h-4" },
  md: { wrapper: "w-12 h-12 rounded-xl", icon: "[&>svg]:w-5 [&>svg]:h-5" },
  lg: { wrapper: "w-14 h-14 rounded-2xl", icon: "[&>svg]:w-6 [&>svg]:h-6" },
};

const variantMap: Record<Variant, { bg: string; text: string; ring: string }> = {
  primary: { bg: "bg-icon-surface", text: "text-icon-primary", ring: "hover:ring-icon-primary/20" },
  secondary: { bg: "bg-icon-surface", text: "text-icon-secondary", ring: "hover:ring-icon-secondary/20" },
  accent: { bg: "bg-icon-accent/12", text: "text-icon-accent", ring: "hover:ring-icon-accent/20" },
  neutral: { bg: "bg-icon-surface/80", text: "text-icon-neutral", ring: "hover:ring-icon-neutral/20" },
};

export default function IconBadge({ variant = "primary", size = "md", children }: IconBadgeProps) {
  const s = sizeMap[size];
  const v = variantMap[variant];

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.08 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center justify-center shrink-0 border border-border/40 hover:shadow-md hover:ring-2 hover:ring-offset-1 transition-shadow duration-300 ${s.wrapper} ${v.bg} ${v.ring}`}
    >
      <motion.div
        whileHover={{ scale: 1.12, rotate: 5 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`${v.text} ${s.icon}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
