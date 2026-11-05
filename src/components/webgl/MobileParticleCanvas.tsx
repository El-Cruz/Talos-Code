"use client";

import { useEffect, useRef } from "react";

const BACKGROUND = "#050914", CYAN = "#66FFFF", ORANGE = "#FF6600";
const MASK_WIDTH = 480, MASK_HEIGHT = 360, GRID = 6, ALPHA_THRESHOLD = 128;
const STEP = 1 / 60;

type Particle = { x: number; y: number; hx: number; hy: number; vx: number; vy: number };

// This transparent, detached canvas is sampled once per mount, never per frame.
function createWorkstationMask() {
  const mask = document.createElement("canvas");
  mask.width = MASK_WIDTH; mask.height = MASK_HEIGHT;
  const ctx = mask.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = CYAN;
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 6;
  // CRT shell, inset glass, vents, pedestal and perspective keyboard.
  ctx.fillRect(68, 20, 344, 230);
  ctx.clearRect(88, 38, 304, 182);
  ctx.strokeRect(100, 50, 280, 158);
  for (let x = 92; x < 200; x += 12) ctx.clearRect(x, 231, 6, 12);
  ctx.clearRect(368, 230, 18, 12);
  ctx.fillRect(210, 250, 60, 20);
  ctx.fillRect(174, 270, 132, 12);
  ctx.beginPath();
  ctx.moveTo(86, 292); ctx.lineTo(394, 292);
  ctx.lineTo(432, 346); ctx.lineTo(48, 346); ctx.closePath(); ctx.stroke();
  for (let row = 0; row < 3; row++) {
    const left = 94 - row * 10, count = 13;
    const keyWidth = (MASK_WIDTH - left * 2) / count;
    for (let col = 0; col < count; col++) {
      ctx.fillRect(left + col * keyWidth, 300 + row * 12, keyWidth - 5, 7);
    }
  }
  ctx.fillRect(174, 336, 132, 6);
  // A block cursor and a few terminal strokes keep the glass recognizable.
  ctx.fillRect(124, 78, 12, 6); ctx.fillRect(130, 84, 12, 6);
  ctx.fillRect(124, 90, 12, 6); ctx.fillRect(154, 90, 48, 6);
  const { data } = ctx.getImageData(0, 0, MASK_WIDTH, MASK_HEIGHT);
  const points: { x: number; y: number }[] = [];
  for (let y = GRID / 2; y < MASK_HEIGHT; y += GRID) {
    for (let x = GRID / 2; x < MASK_WIDTH; x += GRID) {
      if (data[(y * MASK_WIDTH + x) * 4 + 3] > ALPHA_THRESHOLD) points.push({ x, y });
    }
  }
  return points;
}

export function MobileParticleCanvas({ className = "", onReady }: {
  className?: string;
  /** Pass callbacks from a Client Component, not across a Server Component boundary. */
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyCallback = useRef(onReady);
  useEffect(() => { readyCallback.current = onReady; }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) { readyCallback.current?.(); return; }
    const anchors = createWorkstationMask();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: Particle[] = [];
    let width = 0, height = 0, dpr = 1, pixelSize = 2, radius = 80;
    let frame: number | null = null, lastTime = 0, accumulator = 0;
    let awake = false, visible = false, disposed = false, ready = false;
    let pointerId: number | null = null, pointerX = 0, pointerY = 0;

    const draw = () => {
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, height);
      // Two color batches, sharp rectangles, no text shaping, shadows or allocations.
      for (let warm = 0; warm < 2; warm++) {
        ctx.fillStyle = warm ? ORANGE : CYAN;
        for (const p of particles) {
          const dx = p.x - p.hx, dy = p.y - p.hy;
          if (Number(dx * dx + dy * dy > 4) !== warm) continue;
          ctx.fillRect(Math.round(p.x * dpr) / dpr, Math.round(p.y * dpr) / dpr, pixelSize, pixelSize);
        }
      }
    };
    const pause = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; lastTime = 0; accumulator = 0;
    };
    const releasePointer = () => {
      const id = pointerId;
      pointerId = null;
      if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    };
    const step = () => {
      let moving = false;
      const radiusSquared = radius * radius;
      for (const p of particles) {
        if (pointerId !== null) {
          let dx = p.x - pointerX, dy = p.y - pointerY;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < radiusSquared) {
            // Avoid a zero-length normal directly beneath the finger.
            if (distanceSquared < .0001) { dx = 1; dy = 0; }
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = 1.8 * (1 - Math.min(distance / radius, 1)) ** 2;
            p.vx += dx / distance * force; p.vy += dy / distance * force;
          }
        }
        p.vx = (p.vx + (p.hx - p.x) * .022) * .86;
        p.vy = (p.vy + (p.hy - p.y) * .022) * .86;
        p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.x - p.hx) < .1 && Math.abs(p.y - p.hy) < .1 &&
            Math.abs(p.vx) < .025 && Math.abs(p.vy) < .025) {
          p.x = p.hx; p.y = p.hy; p.vx = 0; p.vy = 0;
        } else moving = true;
      }
      return moving;
    };
    const animate = (now: number) => {
      frame = null;
      if (disposed || !awake || !visible || document.hidden) return;
      // Fixed simulation steps keep spring behavior consistent on 30–120 Hz displays.
      accumulator += lastTime ? Math.min((now - lastTime) / 1000, .05) : STEP;
      lastTime = now;
      let stepped = false;
      while (accumulator >= STEP) {
        const moving = step();
        accumulator -= STEP; stepped = true;
        if (!moving && pointerId === null) { awake = false; break; }
      }
      if (stepped) draw();
      if (awake) frame = requestAnimationFrame(animate);
      else { lastTime = 0; accumulator = 0; }
    };
    const schedule = () => {
      if (!disposed && awake && visible && !document.hidden && frame === null) frame = requestAnimationFrame(animate);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (rect.width === width && rect.height === height && nextDpr === dpr) return;
      width = rect.width; height = rect.height; dpr = nextDpr;
      pause(); releasePointer(); awake = false;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = Math.min(width * .9 / MASK_WIDTH, height * .7 / MASK_HEIGHT, 1.8);
      const offsetX = (width - MASK_WIDTH * scale) / 2;
      const offsetY = (height - MASK_HEIGHT * scale) / 2;
      pixelSize = Math.max(1, Math.round(3 * scale * dpr)) / dpr;
      radius = Math.max(48, Math.min(width * .22, 110));
      particles = anchors.map(({ x, y }) => {
        const hx = offsetX + x * scale, hy = offsetY + y * scale;
        return { x: hx, y: hy, hx, hy, vx: 0, vy: 0 };
      });
      draw();
      if (!ready && width > 0 && height > 0) { ready = true; readyCallback.current?.(); }
    };
    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = event.clientX - rect.left; pointerY = event.clientY - rect.top;
      awake = true; schedule();
    };
    const pointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches || !visible || document.hidden || pointerId !== null || !event.isPrimary || event.button !== 0) return;
      pointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      updatePointer(event);
    };
    const pointerMove = (event: PointerEvent) => { if (event.pointerId === pointerId) updatePointer(event); };
    const pointerEnd = (event: PointerEvent) => { if (event.pointerId === pointerId) releasePointer(); };
    const visibilityChange = () => {
      releasePointer();
      if (document.hidden) pause(); else schedule();
    };
    const motionChange = () => {
      if (!reducedMotion.matches) return;
      releasePointer(); pause(); awake = false;
      for (const p of particles) { p.x = p.hx; p.y = p.hy; p.vx = 0; p.vy = 0; }
      draw();
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { releasePointer(); pause(); } else schedule();
    });
    const observer = new ResizeObserver(resize);
    resize(); observer.observe(canvas); intersection.observe(canvas);
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerEnd);
    canvas.addEventListener("pointercancel", pointerEnd);
    canvas.addEventListener("lostpointercapture", pointerEnd);
    window.addEventListener("blur", releasePointer);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibilityChange);
    reducedMotion.addEventListener("change", motionChange);
    return () => {
      disposed = true; pause(); releasePointer();
      observer.disconnect(); intersection.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerEnd);
      canvas.removeEventListener("pointercancel", pointerEnd);
      canvas.removeEventListener("lostpointercapture", pointerEnd);
      window.removeEventListener("blur", releasePointer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibilityChange);
      reducedMotion.removeEventListener("change", motionChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true"
    className={`block h-full w-full bg-[#050914] [touch-action:none] ${className}`} />;
}
