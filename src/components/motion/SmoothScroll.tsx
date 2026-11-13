"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 5), anchors: { offset: -72 } });
    let frame = requestAnimationFrame(function raf(time) { lenis.raf(time); frame = requestAnimationFrame(raf); });
    return () => { cancelAnimationFrame(frame); lenis.destroy(); };
  }, []);
  return null;
}
