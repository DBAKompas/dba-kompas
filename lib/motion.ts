import { type Variants, type Transition, useReducedMotion } from "framer-motion";

export const easing = {
  apple: [0.25, 0.1, 0.25, 1.0] as const,
  appleSmooth: [0.42, 0, 0.58, 1] as const,
  springOut: [0.16, 1, 0.3, 1] as const,
};

export const duration = {
  micro: 0.15,
  short: 0.3,
  medium: 0.5,
  long: 0.8,
  slower: 1.0,
};

export const staggerDelay = 0.07;

const defaultTransition: Transition = {
  duration: duration.long,
  ease: easing.springOut as unknown as number[],
};

export const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: defaultTransition },
  } satisfies Variants,

  fadeDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: defaultTransition },
  } satisfies Variants,

  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: defaultTransition },
  } satisfies Variants,

  fadeLeft: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: defaultTransition },
  } satisfies Variants,

  fadeRight: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: defaultTransition },
  } satisfies Variants,

  scaleIn: {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1, transition: { ...defaultTransition, duration: duration.slower } },
  } satisfies Variants,

  stagger: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  } satisfies Variants,

  staggerFast: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  } satisfies Variants,
};

export const cardHover = {
  y: -6,
  transition: {
    duration: duration.medium,
    ease: easing.springOut as unknown as number[],
  },
};

export const viewportConfig = { once: true, amount: 0, margin: "0px 0px -60px 0px" };

export { useReducedMotion };
