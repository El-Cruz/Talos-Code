"use client";

import { useEffect, useRef, useState } from "react";
import { MobileParticleCanvas } from "./MobileParticleCanvas";
import { createVideoOverlay } from "./createVideoOverlay";
import { addVideoIntent, stepVideoIntent } from "./videoIntent";

export type ParticleVideoSource = {
  src: string; type: string; width: number; height: number; bitrate: number; framerate: number;
};

// Same-origin assets supplied by the application, or override sources for a CDN.
export const particleVideoSources: readonly ParticleVideoSource[] = [
  { src: "/videos/tier3-loop-av1.mp4", type: 'video/mp4; codecs="av01.0.05M.08"', width: 720, height: 1280, bitrate: 1800000, framerate: 30 },
  { src: "/videos/tier3-loop-hevc.mp4", type: 'video/mp4; codecs="hvc1.1.6.L93.B0"', width: 720, height: 1280, bitrate: 1800000, framerate: 30 },
];

async function selectSources(video: HTMLVideoElement, sources: readonly ParticleVideoSource[]) {
  const candidates = await Promise.all(sources.map(async (source, index) => {
    if (!video.canPlayType(source.type)) return { source, score: -1 };
    let score = sources.length - index;
    try {
      const info = await navigator.mediaCapabilities?.decodingInfo({ type: "file", video: {
        contentType: source.type, width: source.width, height: source.height,
        bitrate: source.bitrate, framerate: source.framerate,
      } });
      if (info && !info.supported) return { source, score: -1 };
      if (info?.smooth) score += 10;
      if (info?.powerEfficient) score += 100;
    } catch { /* canPlayType remains the fallback when capabilities querying is unavailable. */ }
    return { source, score };
  }));
  return candidates.filter(item => item.score >= 0).sort((a, b) => b.score - a.score).map(item => item.source);
}

export function MobileParticleVideo({ onReady, sources = particleVideoSources, poster }: {
  onReady: () => void; sources?: readonly ParticleVideoSource[]; poster?: string;
}) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  const readyCallback = useRef(onReady);
  useEffect(() => { readyCallback.current = onReady; }, [onReady]);
  useEffect(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || mediaFailed) return;
    let visible = false, lastDraw = 0;
    let disposed = false, ready = false, frame = 0, videoFrame = 0, dirty = true, playPending = false;
    let overlay: ReturnType<typeof createVideoOverlay> | undefined;
    let intent = 0, rate = 1, strength = 0, phase = 0, lastTime = performance.now(), lastMediaTime = -1;
    let active = false, touchId: number | null = null;
    let previous: { x: number; y: number; time: number } | null = null;
    const pointer = [.5, .5], flow = [0, 0];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const markReady = () => { if (!ready && !disposed) { ready = true; readyCallback.current(); } };
    const showNative = () => {
      overlay?.dispose(); overlay = undefined;
      canvas.style.opacity = "0"; video.style.opacity = "1";
      canvas.dataset.mode = "native-video";
    };
    try { overlay = createVideoOverlay(canvas); canvas.dataset.mode = "video-webgl"; }
    catch (error) { console.warn("[mobile-video] Using native video", error); showNative(); }
    video.muted = true; video.defaultMuted = true; video.autoplay = !reduced.matches;
    const play = () => {
      if (disposed || !visible || document.hidden || reduced.matches || !video.src || !video.paused || playPending) return;
      playPending = true;
      void video.play().catch(() => {
        if (!disposed) { video.style.opacity = "1"; markReady(); }
      }).finally(() => { playPending = false; }); // Retry on the next user gesture.
    };
    const reset = () => { active = false; previous = null; touchId = null; };
    const updatePointer = (x: number, y: number) => {
      if (document.hidden || reduced.matches) return;
      const rect = canvas.getBoundingClientRect(), now = performance.now();
      if (!rect.width || !rect.height) return;
      pointer[0] = (x - rect.left) / rect.width; pointer[1] = 1 - (y - rect.top) / rect.height;
      if (pointer.some(value => value < 0 || value > 1)) { reset(); return; }
      active = true;
      if (previous && now - previous.time < 180) {
        const dt = Math.max((now - previous.time) / 1000, 1 / 240);
        const scale = Math.min(rect.width, rect.height);
        const vx = (x - previous.x) / scale / dt, vy = (previous.y - y) / scale / dt;
        intent = addVideoIntent(intent, Math.hypot(vx, vy), dt);
        flow[0] = Math.max(-1, Math.min(1, vx)); flow[1] = Math.max(-1, Math.min(1, vy));
      }
      previous = { x, y, time: now };
    };
    const pointerMove = (event: PointerEvent) => { if (event.buttons && event.pointerType !== "touch" && touchId === null) updatePointer(event.clientX, event.clientY); };
    const pointerDown = (event: PointerEvent) => { play(); pointerMove(event); };
    const touch = (event: TouchEvent) => {
      play();
      if (touchId === null) { touchId = event.changedTouches[0]?.identifier ?? null; previous = null; }
      for (const point of Array.from(event.touches)) if (point.identifier === touchId) { updatePointer(point.clientX, point.clientY); break; }
    };
    const touchEnd = (event: TouchEvent) => { if (!Array.from(event.touches).some(point => point.identifier === touchId)) reset(); };
    const wheel = (event: WheelEvent) => {
      if (document.hidden || reduced.matches) return;
      const pixels = Math.hypot(event.deltaX, event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
      intent = addVideoIntent(intent, pixels / Math.max(canvas.clientHeight, 1) * 60, 1 / 60);
    };
    const preventScroll = (event: TouchEvent) => { if (event.cancelable) event.preventDefault(); };
    const decodedFrame = () => {
      dirty = true;
      videoFrame = 0;
      if (!disposed && visible && !document.hidden && !reduced.matches) videoFrame = video.requestVideoFrameCallback(decodedFrame);
    };
    const startVideoFrames = () => {
      if (visible && !document.hidden && !reduced.matches && typeof video.requestVideoFrameCallback === "function" && !videoFrame) videoFrame = video.requestVideoFrameCallback(decodedFrame);
    };
    const schedule = () => { if (!disposed && visible && !document.hidden && !frame) frame = requestAnimationFrame(animate); };
    const animate = (now: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      if (now - lastDraw < 1000 / 30) { schedule(); return; }
      lastDraw = now;
      const dt = Math.min((now - lastTime) / 1000, .1); lastTime = now;
      ({ intent, rate } = stepVideoIntent(intent, rate, dt));
      if (reduced.matches) { intent = 0; rate = 1; }
      // Positive, bounded playback only. Never seek or assign currentTime on input.
      if (Math.abs(video.playbackRate - rate) > .01) video.playbackRate = rate;
      const target = reduced.matches ? 0 : active ? .35 + .65 * intent : 0;
      strength += (target - strength) * (1 - Math.exp(-12 * dt));
      phase = (phase + dt * 4) % (Math.PI * 2);
      flow[0] *= Math.exp(-5 * dt); flow[1] *= Math.exp(-5 * dt);
      if (video.readyState >= 2 && video.videoWidth) {
        if (typeof video.requestVideoFrameCallback !== "function") dirty ||= video.currentTime !== lastMediaTime;
        if (overlay && (dirty || strength > .001)) {
          try { overlay.draw(video, dirty, pointer, flow, phase, strength); canvas.style.opacity = "1"; video.style.opacity = "1"; }
          catch (error) { console.warn("[mobile-video] Texture upload failed; using native video", error); showNative(); }
        }
        lastMediaTime = video.currentTime; dirty = false; markReady();
      }
      if (overlay && !reduced.matches) schedule();
    };
    const visibility = () => {
      reset(); intent = 0; cancelAnimationFrame(frame); frame = 0;
      if (document.hidden || !visible) {
        video.pause();
        if (videoFrame) video.cancelVideoFrameCallback(videoFrame);
        videoFrame = 0;
      } else { lastTime = performance.now(); dirty = true; startVideoFrames(); play(); schedule(); }
    };
    const motionChange = () => { reset(); dirty = true; strength = 0; if (reduced.matches) video.pause(); else play(); startVideoFrames(); schedule(); };
    const guardPlayback = () => { if (!visible || document.hidden || reduced.matches) video.pause(); };
    const loaded = () => { dirty = true; guardPlayback(); startVideoFrames(); play(); schedule(); };
    const contextLost = (event: Event) => { event.preventDefault(); showNative(); markReady(); };
    let candidates: ParticleVideoSource[] = [], sourceIndex = 0;
    const nextSource = () => {
      if (disposed) return;
      const source = candidates[sourceIndex++];
      if (!source) { console.warn("[mobile-video] No playable video asset; using the 2D canvas fallback."); markReady(); setMediaFailed(true); return; }
      video.src = source.src; video.load(); play();
    };
    // Do not leave the application's UI hidden if assets are absent or the network stalls.
    const readyTimeout = window.setTimeout(markReady, 3000);
    const observer = new ResizeObserver(() => { dirty = true; schedule(); }); observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibility(); }); intersection.observe(canvas);
    video.addEventListener("loadeddata", loaded); video.addEventListener("error", nextSource); video.addEventListener("play", guardPlayback);
    window.addEventListener("pointermove", pointerMove, { capture: true, passive: true });
    window.addEventListener("pointerdown", pointerDown, { capture: true, passive: true });
    window.addEventListener("pointerup", reset, true); window.addEventListener("pointercancel", reset, true);
    window.addEventListener("touchstart", touch, { capture: true, passive: true });
    window.addEventListener("touchmove", touch, { capture: true, passive: true });
    window.addEventListener("touchend", touchEnd, { capture: true, passive: true });
    window.addEventListener("touchcancel", touchEnd, { capture: true, passive: true });
    window.addEventListener("wheel", wheel, { passive: true, capture: true });
    window.addEventListener("blur", reset); document.documentElement.addEventListener("pointerleave", reset);
    canvas.addEventListener("touchmove", preventScroll, { passive: false });
    canvas.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", motionChange);
    void selectSources(video, sources).then(selected => { if (!disposed) { candidates = selected; nextSource(); } });
    return () => {
      disposed = true; cancelAnimationFrame(frame); clearTimeout(readyTimeout); observer.disconnect(); intersection.disconnect();
      if (videoFrame) video.cancelVideoFrameCallback(videoFrame);
      video.removeEventListener("loadeddata", loaded); video.removeEventListener("error", nextSource); video.removeEventListener("play", guardPlayback);
      window.removeEventListener("pointermove", pointerMove, true); window.removeEventListener("pointerdown", pointerDown, true);
      window.removeEventListener("pointerup", reset, true); window.removeEventListener("pointercancel", reset, true);
      window.removeEventListener("touchstart", touch, true); window.removeEventListener("touchmove", touch, true);
      window.removeEventListener("touchend", touchEnd, true); window.removeEventListener("touchcancel", touchEnd, true);
      window.removeEventListener("wheel", wheel, true); window.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      canvas.removeEventListener("touchmove", preventScroll); canvas.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", motionChange);
      video.pause(); video.removeAttribute("src"); video.load(); overlay?.dispose();
    };
  }, [sources, mediaFailed]);
  if (mediaFailed) return <MobileParticleCanvas onReady={onReady} />;
  return <div className="relative h-full w-full overflow-hidden bg-[#050914]" aria-hidden="true">
    <video ref={videoRef} muted playsInline loop preload="auto" crossOrigin="anonymous" poster={poster}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0" />
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-0 [touch-action:none]" />
  </div>;
}
