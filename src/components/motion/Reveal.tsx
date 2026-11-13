"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { EASE, VIEWPORT } from "./motion";

/** Entrance: opacity + translate only (GPU properties). */
export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT} transition={{ duration: 0.9, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

/** Line mask reveal using clip-path + translate. */
export function LineReveal({ children, delay = 0, className, onMount = false }: { children: ReactNode; delay?: number; className?: string; onMount?: boolean }) {
  const to = { clipPath: "inset(0 0 -20% 0)", y: "0%" };
  return (
    <motion.span className={`block ${className ?? ""}`} initial={{ clipPath: "inset(0 0 100% 0)", y: "40%" }} {...(onMount ? { animate: to } : { whileInView: to, viewport: VIEWPORT })} transition={{ duration: 1.1, delay, ease: EASE }}>
      {children}
    </motion.span>
  );
}
