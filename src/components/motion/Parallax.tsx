"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/** Scroll-linked vertical drift (transform only). `range` in percent of own height. */
export function Parallax({ children, range = 8, className }: { children: ReactNode; range?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${range}%`, `${-range}%`]);
  return <div ref={ref} className={className}><motion.div style={{ y }} className="h-full w-full will-change-transform">{children}</motion.div></div>;
}
