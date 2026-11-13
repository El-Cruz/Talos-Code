"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Dictionary } from "../../content/dictionary";
import { HudFrame } from "../ui/HudFrame";
import { EASE } from "../motion/motion";
import { CLIPS } from "./clips";

const meta = "font-mono text-[11px] uppercase tracking-[0.22em]";
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (s: number) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

function Placeholder({ label, text }: { label: string; text: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div aria-hidden="true" className="reticle absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="absolute h-[62%] aspect-square rounded-full border border-beam/40 animate-spin" style={{ animationDuration: "18s", borderTopColor: "#ff6b2c" }} />
      <div aria-hidden="true" className="absolute h-[42%] aspect-square rounded-full border border-dashed border-glacier/40 animate-spin" style={{ animationDuration: "26s", animationDirection: "reverse" }} />
      <div className="relative text-center">
        <p className="font-display text-4xl font-extrabold uppercase tracking-[-0.015em] text-ivory sm:text-6xl">{label}</p>
        <p className={`${meta} mt-3 text-steel`}>{text}</p>
      </div>
    </div>
  );
}

export function VideoFaq({ t }: { t: Dictionary["faq"] }) {
  const [active, setActive] = useState(0);
  const [openId, setOpenId] = useState<string | null>(t.items[0].id);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const item = t.items[active];
  const clip = CLIPS[item.id];

  // Simulated clock only while the placeholder is showing; a real <video> reports its own time.
  useEffect(() => {
    if (!playing || clip) return;
    const id = window.setInterval(() => setElapsed((e) => (e + 1) % (item.duration + 1)), 1000);
    return () => window.clearInterval(id);
  }, [playing, clip, item.duration]);

  const select = (index: number) => {
    setOpenId((current) => (index === active && current === t.items[index].id ? null : t.items[index].id));
    if (index !== active) { setActive(index); setElapsed(0); }
  };
  const toggle = () => {
    const video = videoRef.current;
    if (video) { if (playing) video.pause(); else void video.play(); }
    setPlaying((p) => !p);
  };

  return (
    <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <HudFrame tag={`[FAQ // ${pad(active + 1)}]`} status="DEMO" className="aspect-video">
          <AnimatePresence mode="wait">
            <motion.div key={item.id} initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: EASE }} className="absolute inset-0">
              {clip ? (
                <video ref={videoRef} className="h-full w-full object-cover" poster={clip.poster} autoPlay muted loop playsInline onTimeUpdate={(e) => setElapsed(Math.floor(e.currentTarget.currentTime))}>
                  {clip.webm && <source src={clip.webm} type="video/webm" />}
                  {clip.mp4 && <source src={clip.mp4} type="video/mp4" />}
                </video>
              ) : <Placeholder label={item.clip} text={t.placeholder} />}
            </motion.div>
          </AnimatePresence>
          <span className={`${meta} pointer-events-none absolute left-6 top-8 flex items-center gap-2 text-plasma`}><span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-plasma" />REC<span className="text-steel">/ DEMO</span></span>
          <span aria-hidden="true" className={`${meta} pointer-events-none absolute right-6 top-8 text-ivory`}>{fmt(elapsed)} / {fmt(item.duration)}</span>
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-white/10"><motion.span className="block h-full origin-left bg-beam" animate={{ scaleX: item.duration ? elapsed / item.duration : 0 }} transition={{ duration: 1, ease: "linear" }} /></span>
        </HudFrame>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={toggle} aria-label={playing ? t.pause : t.play} className={`${meta} border border-white/15 px-4 py-2.5 text-ivory transition-colors hover:border-beam hover:text-beam`}>{playing ? "II" : "▶"}</button>
          <div role="tablist" aria-label={t.clipsLabel} className="flex flex-wrap gap-2">
            {t.items.map((it, i) => (
              <button key={it.id} role="tab" type="button" aria-selected={i === active} onClick={() => select(i)} className={`${meta} border px-3 py-2.5 transition-colors ${i === active ? "border-beam text-beam" : "border-white/10 text-steel hover:border-white/30 hover:text-ivory"}`}>{it.clip}<span className="ml-2 text-steel/60">{fmt(it.duration)}</span></button>
            ))}
          </div>
        </div>
      </div>

      <ul className="lg:col-span-5">
        {t.items.map((it, i) => {
          const open = openId === it.id;
          return (
            <li key={it.id} className="border-t border-white/10 last:border-b">
              <h3>
                <button type="button" aria-expanded={open} aria-controls={`faq-${it.id}`} onClick={() => select(i)} className="group flex w-full items-start gap-4 py-5 text-left">
                  <span className={`${meta} mt-1 shrink-0 ${i === active ? "text-plasma" : "text-steel"}`}>[FAQ // {pad(i + 1)}]</span>
                  <span className={`flex-1 text-base leading-snug transition-colors ${open ? "text-ivory" : "text-steel group-hover:text-ivory"}`}>{it.question}</span>
                  <span aria-hidden="true" className={`mt-0.5 font-mono text-beam transition-transform duration-500 ${open ? "rotate-45" : ""}`}>+</span>
                </button>
              </h3>
              <div id={`faq-${it.id}`} role="region" hidden={!open}>
                {open && (
                  <motion.p initial={{ opacity: 0, y: 10, clipPath: "inset(0 0 100% 0)" }} animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }} transition={{ duration: 0.7, ease: EASE }} className="pb-6 sm:pl-[7.2rem] text-sm leading-relaxed text-steel">{it.answer}</motion.p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
