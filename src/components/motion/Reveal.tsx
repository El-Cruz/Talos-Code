"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { EASE, VIEWPORT } from "./motion";

/** Keep server-rendered content readable while the entrance animation loads. */
export function Reveal({ children, delay = 0, className, distance = 12 }: { children: ReactNode; delay?: number; className?: string; distance?: number }) {
  return (
    <motion.div className={`${className ?? ""} motion-reduce:transform-none!`} initial={{ y: distance }} whileInView={{ y: 0 }} viewport={VIEWPORT} transition={{ duration: 0.65, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

export function LineReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.span className={`block motion-reduce:transform-none! ${className ?? ""}`} initial={{ y: 24 }} animate={{ y: 0 }} transition={{ duration: 0.7, delay, ease: EASE }}>
      {children}
    </motion.span>
  );
}
