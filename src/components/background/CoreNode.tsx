"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MotionValue } from "motion/react";

const LINE_VERT = `
attribute vec3 aDir; uniform float uAssemble; varying float vA;
void main() {
  vec3 p = position + aDir * (1.0 - uAssemble) * 3.2;
  vA = uAssemble;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const LINE_FRAG = `uniform vec3 uColor; varying float vA; void main() { gl_FragColor = vec4(uColor, 0.12 + 0.88 * vA); }`;

/** Wireframe edges whose segments fly in from random directions as `uAssemble` goes 0 -> 1. */
function edges(radius: number, detail: number, color: number) {
  const geo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(radius, detail));
  const pos = geo.getAttribute("position");
  const dirs = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 2) {
    const d = new THREE.Vector3((pos.getX(i) + pos.getX(i + 1)) / 2, (pos.getY(i) + pos.getY(i + 1)) / 2, (pos.getZ(i) + pos.getZ(i + 1)) / 2).normalize().multiplyScalar(0.6 + Math.random());
    d.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5));
    dirs.set([d.x, d.y, d.z, d.x, d.y, d.z], i * 3);
  }
  geo.setAttribute("aDir", new THREE.BufferAttribute(dirs, 3));
  const material = new THREE.ShaderMaterial({ vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, uniforms: { uAssemble: { value: 0 }, uColor: { value: new THREE.Color(color) } }, transparent: true });
  return new THREE.LineSegments(geo, material);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Modular geodesic node: wireframe shell + dark glass + plasma core + orbiting data rings. */
export function CoreNode({ progress }: { progress: MotionValue<number> }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas"); // fresh per run: StrictMode must not reuse a lost context
    canvas.className = "block h-full w-full";
    host.appendChild(canvas);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" }); } catch { canvas.remove(); return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
    camera.position.z = 7.4;
    const root = new THREE.Group();
    scene.add(root);

    const shell = edges(1.25, 1, 0x00e5ff);
    const inner = edges(0.58, 0, 0xff6b2c);
    const glass = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), new THREE.MeshBasicMaterial({ color: 0x0a1420, transparent: true, opacity: 0, depthWrite: false }));
    root.add(glass, shell, inner);

    const orbits: { group: THREE.Group; speed: number }[] = [];
    const ringMats: THREE.MeshBasicMaterial[] = [];
    const rings = new THREE.Group();
    root.add(rings);
    [[1.75, 0.5, 0.2, 0x00e5ff, 0.7], [2.05, -0.9, 0.7, 0x38bdf8, -0.5], [2.35, 1.3, -0.5, 0xff6b2c, 0.35]].forEach(([r, rx, ry, color, speed]) => {
      const tilt = new THREE.Group();
      tilt.rotation.set(rx, ry, 0);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 });
      ringMats.push(mat);
      tilt.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.005, 6, 180), mat));
      const orbit = new THREE.Group();
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), mat);
      node.position.x = r;
      orbit.add(node);
      tilt.add(orbit);
      rings.add(tilt);
      orbits.push({ group: orbit, speed });
    });

    const halo = new THREE.BufferGeometry();
    const haloPos = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2.6 + Math.random() * 0.8);
      haloPos.set([v.x, v.y, v.z], i * 3);
    }
    halo.setAttribute("position", new THREE.BufferAttribute(haloPos, 3));
    const haloMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.03, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    root.add(new THREE.Points(halo, haloMat));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    let visible = true, frame = 0, last = 0, time = 4, assemble = 0;

    const draw = (dt: number) => {
      const p = progress.get();
      assemble += (clamp01(p * 1.7) - assemble) * (1 - Math.exp(-dt * 4));
      const k = 1 - Math.exp(-dt * 5);
      ptr.x += (ptr.tx - ptr.x) * k; ptr.y += (ptr.ty - ptr.y) * k;
      (shell.material as THREE.ShaderMaterial).uniforms.uAssemble.value = assemble;
      (inner.material as THREE.ShaderMaterial).uniforms.uAssemble.value = clamp01(assemble * 1.2 - 0.1);
      (glass.material as THREE.MeshBasicMaterial).opacity = 0.55 * assemble;
      haloMat.opacity = 0.7 * assemble;
      ringMats.forEach((m) => { m.opacity = 0.85 * clamp01(assemble * 2 - 0.5); });
      rings.scale.setScalar(0.4 + 0.6 * assemble);
      root.rotation.y = time * 0.18 + p * Math.PI * 0.9 + ptr.x * 0.5;
      root.rotation.x = 0.25 + ptr.y * 0.3;
      inner.rotation.y = -time * 0.5; inner.rotation.x = time * 0.3;
      orbits.forEach((o) => { o.group.rotation.z = time * o.speed; });
      renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1); last = now; time += dt;
      draw(dt);
    };
    const start = () => { if (!frame && visible && !document.hidden && !reduced.matches) { last = performance.now(); frame = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (reduced.matches) draw(10);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced.matches) return;
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1; ptr.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); });
    const ro = new ResizeObserver(resize);
    const unsubscribe = progress.on("change", () => { if (reduced.matches) draw(10); });

    resize(); io.observe(host); ro.observe(host); start();
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop(); io.disconnect(); ro.disconnect(); unsubscribe();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material as THREE.Material | undefined;
        if (m) m.dispose();
      });
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, [progress]);

  return <div ref={hostRef} aria-hidden="true" className="aspect-square w-full" />;
}
