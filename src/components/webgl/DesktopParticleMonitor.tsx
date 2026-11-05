"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { createDesktopCompute } from "./desktopCompute";
import { burstValue, type BurstTransition } from "./burstTransition";
import { bootState } from "./bootSequence";
import { createPointerProjector, pointerToNDC } from "./pointerInteraction";

export default function DesktopParticleMonitor({ activeTab, count, onReady, onFailure }: {
  activeTab: string; count: number; onReady: () => void; onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onFailure });
  useEffect(() => { callbacks.current = { onReady, onFailure }; }, [onReady, onFailure]);
  const previousTab = useRef(activeTab);
  const burst = useRef<BurstTransition>({ start: -Infinity, from: 0 });
  useEffect(() => {
    if (previousTab.current !== activeTab) {
      const now = performance.now();
      burst.current = { start: now, from: burstValue(burst.current, now) };
      previousTab.current = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let release = () => {};
    const initialize = async () => {
      const renderer = new THREE.WebGPURenderer({ antialias: false, alpha: true });
      let simulation: ReturnType<typeof createDesktopCompute> | undefined;
      let frame = 0;
      const cleanups: (() => void)[] = [];
      let released = false;
      const dispose = () => {
        if (released) return;
        released = true;
        cancelAnimationFrame(frame);
        cleanups.forEach(cleanup => cleanup());
        simulation?.particles.geometry.dispose();
        simulation?.material.dispose();
        simulation?.initialize.dispose();
        simulation?.update.dispose();
        void renderer.dispose().catch(error => console.warn("[desktop-particles] Renderer cleanup failed", error));
        renderer.domElement.remove();
      };
      // r187 runtime sends an object; older @types declarations describe a string.
      const fail = (info: string | { message: string }) => {
        if (cancelled || released) return;
        console.error("[desktop-particles] GPU unavailable:", typeof info === "string" ? info : info.message);
        dispose(); callbacks.current.onFailure();
      };
      renderer.onDeviceLost = fail;
      renderer.onError = fail;
      try {
        // WebGPURenderer selects WebGLBackend if WebGPU adapter initialization fails.
        await renderer.init();
        if (cancelled || released) { dispose(); return; }
        release = dispose;
        const webgpu = "isWebGPUBackend" in renderer.backend;
        const particleCount = webgpu ? count : Math.min(count, 262144);
        renderer.domElement.dataset.backend = webgpu ? "webgpu" : "webgl2-transform-feedback";
        renderer.domElement.dataset.particleCount = String(particleCount);
        renderer.domElement.style.touchAction = "none";
        renderer.setClearColor(0x050914, 0);
        element.appendChild(renderer.domElement);
        simulation = createDesktopCompute(particleCount);
        const state = simulation;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, .1, 60);
        const particles = state.particles;
        particles.rotation.set(.08, -.35, 0);
        scene.add(particles);
        const resize = () => {
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          renderer.setSize(rect.width, rect.height);
          camera.aspect = rect.width / rect.height;
          camera.position.set(0, 0, Math.max(9.5, 6 / camera.aspect));
          camera.lookAt(0, -.45, 0);
          camera.updateProjectionMatrix();
          particles.position.x = rect.width > 768 ? .9 : 0;
          camera.updateMatrixWorld(); particles.updateMatrixWorld();
          const depth = camera.position.length();
          const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth;
          state.galaxyExtent.value.set(halfHeight * camera.aspect, halfHeight);
          state.galaxyMatrix.value.copy(particles.matrixWorld).invert().multiply(camera.matrixWorld)
            .multiply(new THREE.Matrix4().makeTranslation(0, 0, -depth));
        };
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        cleanups.push(() => observer.disconnect());
        resize();
        renderer.compute(state.initialize);
        await renderer.compileAsync(scene, camera);
        if (cancelled || released) { dispose(); return; }

        const ndc = new THREE.Vector2(), hit = new THREE.Vector3(), inverse = new THREE.Matrix4();
        const project = createPointerProjector();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        let pointerActive = false, ready = false;
        let start = performance.now(), last = start;
        let fieldTime = 0;
        let hiddenAt: number | null = document.hidden ? start : null;
        const resetPointer = () => { pointerActive = false; };
        const move = (event: PointerEvent) => {
          if (document.hidden || !event.isPrimary) return;
          pointerActive = pointerToNDC(event.clientX, event.clientY, renderer.domElement.getBoundingClientRect(), ndc);
        };
        const end = (event: PointerEvent) => { if (event.pointerType !== "mouse") resetPointer(); };
        const preventScroll = (event: TouchEvent) => { if (event.cancelable) event.preventDefault(); };
        window.addEventListener("pointermove", move, { capture: true, passive: true });
        window.addEventListener("pointerdown", move, { capture: true, passive: true });
        window.addEventListener("pointerup", end, true);
        window.addEventListener("pointercancel", resetPointer, true);
        window.addEventListener("blur", resetPointer);
        document.documentElement.addEventListener("pointerleave", resetPointer);
        renderer.domElement.addEventListener("touchmove", preventScroll, { passive: false });
        cleanups.push(() => {
          window.removeEventListener("pointermove", move, true);
          window.removeEventListener("pointerdown", move, true);
          window.removeEventListener("pointerup", end, true);
          window.removeEventListener("pointercancel", resetPointer, true);
          window.removeEventListener("blur", resetPointer);
          document.documentElement.removeEventListener("pointerleave", resetPointer);
          renderer.domElement.removeEventListener("touchmove", preventScroll);
        });
        const animate = () => {
          if (cancelled || document.hidden || released) return;
          try {
            const now = performance.now(), dt = Math.min((now - last) / 1000, 1 / 60);
            last = now;
            const loading = bootState(now - start);
            state.dt.value = reduced.matches ? 0 : dt;
            state.motion.value = reduced.matches ? 0 : 1;
            const tabScatter = burstValue(burst.current, now);
            fieldTime = loading.stage === "UI_ACTIVE" ? fieldTime + dt : loading.driftTime;
            state.time.value = reduced.matches ? 0 : fieldTime;
            state.transition.value = reduced.matches ? 0 : loading.stage === "UI_ACTIVE" ? tabScatter : loading.scatter;
            state.explosion.value = reduced.matches ? 0 : loading.stage === "UI_ACTIVE" ? tabScatter : loading.explosion;
            renderer.domElement.dataset.bootStage = reduced.matches ? "UI_ACTIVE" : loading.stage;
            particles.updateMatrixWorld(); camera.updateMatrixWorld();
            let active = pointerActive && !reduced.matches;
            if (active) {
              // Galaxy input intersects its camera-facing plane across the whole screen.
              if (state.transition.value > 0) {
                hit.set(ndc.x * state.galaxyExtent.value.x, ndc.y * state.galaxyExtent.value.y, 0)
                  .applyMatrix4(state.galaxyMatrix.value);
                state.pointer.value.lerp(hit, 1 - Math.exp(-18 * dt));
              } else active = project(ndc, camera, particles.matrixWorld, hit);
              // Projector returns view space; compute and SDF operate in model space.
              if (state.transition.value === 0) state.pointer.value.copy(hit).applyMatrix4(camera.matrixWorld).applyMatrix4(inverse.copy(particles.matrixWorld).invert());
            }
            state.pointerActive.value += ((active ? 1 : 0) - state.pointerActive.value) * (1 - Math.exp(-12 * dt));
            // Baked SDF anchors stay immutable: field animation lives in positionNode.
            // This also leaves the assembled CRT completely static at transition=0.
            renderer.render(scene, camera);
            if (!ready && (reduced.matches || loading.stage === "UI_ACTIVE")) { ready = true; callbacks.current.onReady(); }
            frame = requestAnimationFrame(animate);
          } catch (error) {
            console.error("[desktop-particles] Compute/render failed", error);
            dispose(); callbacks.current.onFailure();
          }
        };
        const visibility = () => {
          resetPointer(); cancelAnimationFrame(frame);
          if (document.hidden) hiddenAt = performance.now();
          else {
            const now = performance.now();
            if (hiddenAt !== null) {
              start += now - hiddenAt;
              if (Number.isFinite(burst.current.start)) burst.current.start += now - Math.max(hiddenAt, burst.current.start);
            }
            hiddenAt = null; last = now; frame = requestAnimationFrame(animate);
          }
        };
        document.addEventListener("visibilitychange", visibility);
        cleanups.push(() => document.removeEventListener("visibilitychange", visibility));
        if (!document.hidden) frame = requestAnimationFrame(animate);
      } catch (error) {
        dispose();
        if (!cancelled) { console.error("[desktop-particles] Initialization failed", error); callbacks.current.onFailure(); }
      }
    };
    void initialize();
    return () => { cancelled = true; release(); };
  }, [count]);
  return <div ref={host} className="h-full w-full" />;
}
