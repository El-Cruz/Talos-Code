"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/** Mid layer between particles (0.3x) and content (1x): reticle grid at 0.6x, cursor-lit, plus warm atmosphere. */
export function HudLayer() {
  const root = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => -((v * 0.6) % 72));

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0, x = 0, yy = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; yy = e.clientY;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; el.style.setProperty("--cx", `${x}px`); el.style.setProperty("--cy", `${yy}px`); });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(55% 45% at 6% 96%, rgb(255 107 44 / 0.10), transparent 70%), radial-gradient(50% 45% at 96% 6%, rgb(124 58 237 / 0.13), transparent 70%)" }} />
      <motion.div style={{ y }} className="reticle absolute inset-x-0 -top-[72px] bottom-0 will-change-transform" />
      <div className="reticle-mask absolute inset-0 opacity-90"><motion.div style={{ y }} className="reticle-bright absolute inset-x-0 -top-[72px] bottom-0 will-change-transform" /></div>
      <div className="sweep absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-beam/25 to-transparent" />
      <span className="absolute left-4 top-4 font-mono text-xs text-beam/50">+</span>
      <span className="absolute right-4 top-4 font-mono text-xs text-beam/50">+</span>
      <span className="absolute bottom-4 left-4 font-mono text-xs text-plasma/60">+</span>
      <span className="absolute bottom-4 right-4 font-mono text-xs text-plasma/60">+</span>
    </div>
  );
}

/** Live pointer/scroll readout; writes textContent directly (no re-renders). */
export function Telemetry() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0, px = 0, py = 0;
    const paint = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      el.textContent = `X ${(px / window.innerWidth).toFixed(2)} Y ${(py / window.innerHeight).toFixed(2)} · ${String(Math.round((window.scrollY / max) * 100)).padStart(3, "0")}%`;
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; queue(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("scroll", queue); cancelAnimationFrame(frame); };
  }, []);
  return <span ref={ref}>X 0.00 Y 0.00 · 000%</span>;
}
