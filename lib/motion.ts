import type { Transition, Variants } from "framer-motion";

/** Global spring for layout / tab / panel transitions. */
export const spring: Transition = { type: "spring", stiffness: 300, damping: 30 };

/** Page transitions: 150ms fade + 8px y-translate. */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.1, ease: "easeIn" } },
};

/** Staggered list entrance for grids and feeds. */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
};

/** Overlay panels (AI script engine) slide in from the right. */
export const slideInRight: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: spring },
  exit: { x: "100%", transition: { duration: 0.18, ease: "easeIn" } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
