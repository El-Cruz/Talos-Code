"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Stage 0 cloud (hero) -> 1 lattice (services) -> 2 flow (work) -> 3 ring (about/contact).
const VERT = `
attribute vec3 aCloud; attribute vec3 aLattice; attribute vec3 aFlow; attribute vec3 aRing; attribute float aSeed;
uniform float uTime; uniform float uStage; uniform vec2 uExtent; uniform vec2 uPointer; uniform float uInfluence; uniform float uShift; uniform float uPx;
varying float vNear; varying float vSeed;
void main() {
  float t = uTime;
  vec3 cloud = aCloud; cloud.xy *= uExtent;
  cloud.x += sin(t * 0.15 + aSeed * 40.0) * 0.25; cloud.y += cos(t * 0.12 + aSeed * 31.0) * 0.25;
  vec3 lat = aLattice; lat.xy *= uExtent;
  lat.z += sin(lat.x * 1.2 + t * 0.6) * 0.18 + cos(lat.y * 1.5 - t * 0.5) * 0.12;
  vec3 flow = aFlow; flow.xy *= uExtent;
  float W = uExtent.x * 2.2;
  flow.x = mod(flow.x + uExtent.x * 1.1 + t * (0.35 + aSeed * 0.5), W) - uExtent.x * 1.1;
  flow.y += sin(flow.x * 0.7 + aSeed * 6.283 + t * 0.5) * 0.3;
  vec3 ring = cloud * 0.9; // final stage: calm field, the CoreNode is the focal object

  float k1 = smoothstep(aSeed * 0.4, 0.6 + aSeed * 0.4, clamp(uStage, 0.0, 1.0));
  float k2 = smoothstep(aSeed * 0.4, 0.6 + aSeed * 0.4, clamp(uStage - 1.0, 0.0, 1.0));
  float k3 = smoothstep(aSeed * 0.4, 0.6 + aSeed * 0.4, clamp(uStage - 2.0, 0.0, 1.0));
  vec3 p = mix(cloud, lat, k1); p = mix(p, flow, k2); p = mix(p, ring, k3);

  // Differential parallax: field drifts at 0.3x of content speed, wrapped; released into the ring at the end.
  float H = uExtent.y * 1.15;
  p.y = mod(p.y + uShift * (1.0 - k3) + H, 2.0 * H) - H;

  vec2 d = p.xy - uPointer; float r2 = dot(d, d);
  float f = exp(-r2 * 0.8) * uInfluence;
  p.xy += d / (sqrt(r2) + 0.15) * f * 0.75; p.z += f * 0.6;
  vNear = f; vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (3.4 + aSeed * 3.2 + f * 6.0) * (7.0 / -mv.z);
}`;

const FRAG = `
uniform float uTime; varying float vNear; varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d); a *= a;
  vec3 ice = vec3(0.22, 0.74, 0.97), cyan = vec3(0.0, 0.9, 1.0), amber = vec3(1.0, 0.42, 0.17), violet = vec3(0.49, 0.23, 0.93);
  vec3 col = mix(ice, cyan, vSeed);
  if (vSeed > 0.94) col = amber; else if (vSeed < 0.04) col = violet;
  col = mix(col, amber, vNear * 0.55);
  float tw = 0.75 + 0.25 * sin(uTime * 1.5 + vSeed * 60.0);
  gl_FragColor = vec4(col, a * (0.5 + 0.5 * vNear) * tw * 0.95);
}`;

const CAM_Z = 7;
const FOV = 50;

function buildGeometry(count: number) {
  const cloud = new Float32Array(count * 3), lattice = new Float32Array(count * 3), flow = new Float32Array(count * 3), ring = new Float32Array(count * 3), seed = new Float32Array(count);
  const cols = Math.ceil(Math.sqrt(count * 2)), rows = Math.ceil(count / cols), lanes = 14;
  for (let i = 0; i < count; i++) {
    const o = i * 3, r = () => Math.random();
    seed[i] = r();
    cloud.set([(r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 6], o);
    lattice.set([((i % cols) / cols - 0.5) * 2, (Math.floor(i / cols) / rows - 0.5) * 2, -1.5 + (r() - 0.5) * 0.1], o);
    const lane = Math.floor(r() * lanes);
    flow.set([(r() - 0.5) * 2, (lane / (lanes - 1) - 0.5) * 2 + (r() - 0.5) * 0.02, (lane % 5 - 2) * 0.7], o);
    const angle = r() * Math.PI * 2, radius = 2.4 + (r() - 0.5) * 0.4;
    ring.set([Math.cos(angle) * radius, Math.sin(angle) * radius, (r() - 0.5) * 1.4], o);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(cloud.slice(), 3));
  geometry.setAttribute("aCloud", new THREE.BufferAttribute(cloud, 3));
  geometry.setAttribute("aLattice", new THREE.BufferAttribute(lattice, 3));
  geometry.setAttribute("aFlow", new THREE.BufferAttribute(flow, 3));
  geometry.setAttribute("aRing", new THREE.BufferAttribute(ring, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  return geometry;
}

export function ParticleField() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas"); // fresh canvas per effect run: StrictMode remounts must not reuse a lost context
    canvas.className = "h-full w-full";
    host.appendChild(canvas);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" }); } catch { canvas.remove(); return; }

    const mobile = window.innerWidth < 768;
    const geometry = buildGeometry(mobile ? 1800 : 3600);
    const uniforms = {
      uTime: { value: 8 }, uStage: { value: 0 }, uExtent: { value: new THREE.Vector2(5, 3.3) }, uPointer: { value: new THREE.Vector2(0, 0) },
      uInfluence: { value: 0 }, uShift: { value: 0 }, uPx: { value: 1 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(points);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    camera.position.z = CAM_Z;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const halfH = Math.tan((FOV * Math.PI) / 360) * CAM_Z;
    const target = { x: 0, y: 0, on: 0 };
    let visible = true, frame = 0, last = 0, time = 8, stage = 0, unitsPerPx = 0.007;

    const progress = () => { const max = document.documentElement.scrollHeight - window.innerHeight; return max > 0 ? Math.min(1, window.scrollY / max) : 0; };
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      uniforms.uExtent.value.set(halfH * camera.aspect, halfH);
      uniforms.uPx.value = dpr; unitsPerPx = (2 * halfH) / h;
      if (reduced.matches) draw();
    };
    const sync = (dt: number) => {
      const k = 1 - Math.exp(-dt * 6), s = 1 - Math.exp(-dt * 3);
      const u = uniforms.uPointer.value;
      u.x += (target.x * uniforms.uExtent.value.x - u.x) * k; u.y += (target.y * halfH - u.y) * k;
      uniforms.uInfluence.value += (target.on - uniforms.uInfluence.value) * k;
      stage += (progress() * 3 - stage) * s;
      uniforms.uStage.value = stage; uniforms.uTime.value = time;
      uniforms.uShift.value = window.scrollY * 0.3 * unitsPerPx;
    };
    const draw = () => { sync(1); renderer.render(scene, camera); };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1); last = now; time += dt;
      sync(dt); renderer.render(scene, camera);
    };
    const start = () => { if (!frame && visible && !document.hidden && !reduced.matches) { last = performance.now(); frame = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = (e.clientX / window.innerWidth) * 2 - 1; target.y = 1 - (e.clientY / window.innerHeight) * 2; target.on = reduced.matches ? 0 : 1;
    };
    const onLeave = () => { target.on = 0; };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onScroll = () => { if (reduced.matches) draw(); };
    const onMotion = () => { if (reduced.matches) { stop(); target.on = 0; draw(); } else start(); };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); });

    resize(); io.observe(canvas); start(); if (reduced.matches) draw();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMotion);
    return () => {
      stop(); io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotion);
      scene.remove(points); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20" />;
}
