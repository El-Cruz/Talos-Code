"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { Dictionary } from "../../content/dictionary";
import { HudFrame } from "../ui/HudFrame";
import { Reveal } from "../motion/Reveal";

const CoreNode = dynamic(() => import("../background/CoreNode").then((m) => m.CoreNode), { ssr: false });

type Tone = "k" | "s" | "f" | "c" | "n" | "ok";
type Token = readonly [string, Tone];
const TONE: Record<Tone, string> = { k: "text-glacier", s: "text-plasma", f: "text-beam", c: "text-steel/60", n: "text-ivory/90", ok: "text-beam" };

// Hoisted: static content, never re-created on render.
const LINES: readonly (readonly Token[])[] = [
  [["// TalosEnvironment.tsx", "c"]],
  [["import ", "k"], ["{ Node3D, Loyalty, Edge } ", "n"], ["from ", "k"], ["\"@talos/core\"", "s"], [";", "n"]],
  [],
  [["export default function ", "k"], ["TalosEnvironment", "f"], ["() {", "n"]],
  [["  const ", "k"], ["env = ", "n"], ["assemble", "f"], ["({ web: true, mobile: true, wallet: ", "n"], ["\"apple+google\"", "s"], [" });", "n"]],
  [["  ", "n"], ["deploy", "f"], ["(env, { target: ", "n"], ["\"edge\"", "s"], [", scale: ", "n"], ["\"auto\"", "s"], [" });", "n"]],
  [["  ", "n"], ["mount", "f"], ["(<", "n"], ["Node3D", "f"], [" rings={", "n"], ["3", "s"], ["} />);", "n"]],
  [["  return ", "k"], ["<", "n"], ["Loyalty", "f"], [" wallets={[", "n"], ["\"apple\", \"google\"", "s"], ["]} />;", "n"]],
  [["}", "n"]],
  [],
  [["BUILD_STATUS: READY // QUITO_EC", "ok"]],
];

/** Each line reveals from scroll progress alone (MotionValues): no React re-render per frame or per letter. */
function Line({ progress, index, tokens }: { progress: MotionValue<number>; index: number; tokens: readonly Token[] }) {
  const start = (index / LINES.length) * 0.8;
  const end = start + 0.8 / LINES.length + 0.05;
  const reveal = useTransform(progress, [start, end], [0, 1], { clamp: true });
  const clipPath = useTransform(reveal, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);
  const x = useTransform(reveal, [0, 1], [-10, 0]);
  return (
    <motion.div style={{ opacity: reveal, clipPath, x }} className="min-h-[1.6em] whitespace-pre">
      <span className="mr-4 inline-block w-5 select-none text-right text-steel/40">{index + 1}</span>
      {tokens.map(([text, tone], i) => <span key={i} className={TONE[tone]}>{text}</span>)}
    </motion.div>
  );
}

export function Closing({ t }: { t: Dictionary["build"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 60%"] });
  return (
    <section ref={ref} id="build" aria-labelledby="build-heading" className="relative border-t border-white/10">
      <div className="mx-auto w-full max-w-[88rem] px-6 py-24 sm:px-10 sm:py-32">
        <Reveal className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-beam">[BUILD // 01]</p>
          <h2 id="build-heading" className="mt-4 font-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.02em] text-ivory">{t.heading}</h2>
          <p className="mt-6 max-w-[48ch] text-sm leading-relaxed text-steel">{t.lead}</p>
        </Reveal>
        <div className="mt-16 grid items-center gap-x-10 gap-y-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <HudFrame tag="TalosEnvironment.tsx" status="BUILD // LIVE" className="px-5 pb-10 pt-11 sm:px-8">
              <motion.span aria-hidden="true" style={{ opacity: scrollYProgress }} className="pointer-events-none absolute inset-0 border border-beam/70 shadow-[inset_0_0_40px_rgb(0_229_255/0.12)]" />
              <div aria-hidden="true" className="overflow-x-clip font-mono text-[11px] leading-relaxed sm:text-[13px]">
                {LINES.map((tokens, i) => <Line key={i} progress={scrollYProgress} index={i} tokens={tokens} />)}
              </div>
              <p className="sr-only">BUILD_STATUS: READY // QUITO_EC</p>
            </HudFrame>
          </div>
          <div className="mx-auto w-full max-w-[32rem] lg:col-span-5">
            <CoreNode progress={scrollYProgress} />
          </div>
        </div>
      </div>
      <motion.div aria-hidden="true" style={{ scaleX: scrollYProgress }} className="h-px origin-left bg-gradient-to-r from-beam via-beam to-plasma" />
    </section>
  );
}
