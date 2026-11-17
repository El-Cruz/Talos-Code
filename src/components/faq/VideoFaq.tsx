"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Dictionary } from "../../content/dictionary";
import { HudFrame } from "../ui/HudFrame";
import { EASE, VIEWPORT } from "../motion/motion";
import { CLIPS, type ClipSource } from "./clips";

const meta = "font-mono text-[11px] uppercase tracking-[0.22em]";
const pad = (n: number) => String(n).padStart(2, "0");

function VideoMessage({ topic, message }: { topic: string; message: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-4 sm:p-8">
      <div aria-hidden="true" className="reticle absolute inset-0 opacity-60" />
      <span aria-hidden="true" className="absolute aspect-square h-[70%] rounded-full border border-beam/25" />
      <span aria-hidden="true" className="absolute aspect-square h-[54%] rounded-full border border-dashed border-glacier/30" />
      <div role="status" className="relative text-center">
        <p className="font-display text-3xl font-bold leading-tight text-ivory sm:text-5xl">{topic}</p>
        <p className="mt-2 text-sm text-steel">{message}</p>
      </div>
    </div>
  );
}

function FaqClip({ clip, topic, unavailable }: { clip: ClipSource; topic: string; unavailable: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    video.muted = true;
    // Native controls remain available if the browser blocks autoplay.
    void video.play().catch(() => {});
  }, []);

  if (failed) return <VideoMessage topic={topic} message={unavailable} />;

  return (
    <video
      ref={videoRef}
      aria-label={topic}
      className="absolute inset-0 size-full bg-obsidian object-contain"
      controls
      muted
      loop
      playsInline
      preload="metadata"
      poster={clip.poster}
      onError={(event) => {
        if (event.target === event.currentTarget) setFailed(true);
      }}
    >
      {clip.webm && <source src={clip.webm} type="video/webm" onError={clip.mp4 ? undefined : () => setFailed(true)} />}
      {clip.mp4 && <source src={clip.mp4} type="video/mp4" onError={() => setFailed(true)} />}
    </video>
  );
}

export function VideoFaq({ t }: { t: Dictionary["faq"] }) {
  const [activeId, setActiveId] = useState(t.items[0]?.id);
  const [openId, setOpenId] = useState<string | null>(t.items[0]?.id ?? null);
  const activeItem = t.items.find((item) => item.id === activeId) ?? t.items[0];
  if (!activeItem) return null;

  const clip = CLIPS[activeItem.id];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <div id="faq-video" role="group" aria-label={activeItem.topic}>
          <HudFrame className="aspect-video">
            {clip && (clip.webm || clip.mp4) ? (
              <FaqClip key={activeItem.id} clip={clip} topic={activeItem.topic} unavailable={t.videoUnavailable} />
            ) : (
              <VideoMessage topic={activeItem.topic} message={t.videoPending} />
            )}
          </HudFrame>
        </div>
        <div role="group" aria-label={t.topicsLabel} className="mt-4 flex flex-wrap gap-2">
          {t.items.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === activeItem.id}
              aria-controls={`faq-video faq-${item.id}`}
              onClick={() => {
                setActiveId(item.id);
                setOpenId(item.id);
              }}
              className="min-h-11 border border-white/15 px-3 py-2 text-sm text-ivory hover:border-beam aria-pressed:border-beam aria-pressed:text-beam"
            >
              {item.topic}
            </button>
          ))}
        </div>
      </div>

      <ul className="min-w-0 lg:col-span-5">
        {t.items.map((item, index) => {
          const open = openId === item.id;
          const answerId = `faq-${item.id}`;

          return (
            <motion.li key={item.id} initial={{ x: 12 }} whileInView={{ x: 0 }} viewport={VIEWPORT} transition={{ duration: 0.45, delay: index * 0.06, ease: EASE }} className="border-t border-white/10 last:border-b motion-reduce:transform-none!">
              <h3>
                <button
                  type="button"
                  id={`${answerId}-question`}
                  aria-expanded={open}
                  aria-controls={answerId}
                  onClick={() => {
                    setActiveId(item.id);
                    setOpenId(open ? null : item.id);
                  }}
                  className="group flex w-full items-start gap-4 py-5 text-left"
                >
                  <span className={`${meta} mt-1 shrink-0 ${open ? "text-plasma" : "text-steel"}`}>
                    [{pad(index + 1)}]
                  </span>
                  <span className={`flex-1 text-base leading-snug transition-colors ${open ? "text-ivory" : "text-steel group-hover:text-ivory"}`}>
                    {item.question}
                  </span>
                  <span aria-hidden="true" className={`mt-0.5 font-mono text-beam transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
              </h3>
              <div id={answerId} role="region" aria-labelledby={`${answerId}-question`} hidden={!open}>
                {open && (
                  <motion.p
                    initial={{ y: 6 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="pb-6 text-sm leading-relaxed text-steel sm:pl-12"
                  >
                    {item.answer}
                  </motion.p>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
