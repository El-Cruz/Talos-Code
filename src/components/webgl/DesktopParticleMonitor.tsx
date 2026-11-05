"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { createDesktopCompute } from "./desktopCompute";
import { burstValue, type BurstTransition } from "./burstTransition";
import { bootState, heroPose } from "./bootSequence";
import { pointerToNDC } from "./pointerInteraction";

export default function DesktopParticleMonitor({ activeTab, count, onReady, onFailure, heroReady = false }: {
  activeTab: string; count: number; onReady: () => void; onFailure: () => void; heroReady?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onFailure, heroReady });
  useEffect(() => { callbacks.current = { onReady, onFailure, heroReady }; }, [onReady, onFailure, heroReady]);
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
        let buildProgress = 0, poseProgress = 0;
        const applyPose = () => {
          // Frontal assembly first, then a top-lateral object rotation after title reveal.
          camera.position.set(0, THREE.MathUtils.lerp(2.8, -.45, buildProgress), Math.max(9.5, 6 / camera.aspect));
          camera.lookAt(0, -.45, 0); camera.updateMatrixWorld();
          particles.rotation.set(.38 * poseProgress, -.55 * poseProgress, 0);
          particles.position.x = camera.aspect > 1 ? .9 * poseProgress : 0;
          particles.updateMatrixWorld();
        };
        scene.add(particles);
        const resize = () => {
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          renderer.setSize(rect.width, rect.height);
          camera.aspect = rect.width / rect.height;
          camera.updateProjectionMatrix();
          applyPose();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        cleanups.push(() => observer.disconnect());
        resize();
        renderer.compute(state.initialize);
        await renderer.compileAsync(scene, camera);
        if (cancelled || released) { dispose(); return; }

        const ndc = new THREE.Vector2(), hit = new THREE.Vector3(), inverse = new THREE.Matrix4();
        const caster = new THREE.Raycaster(), localRay = new THREE.Ray();
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.15);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        let pointerActive = false, ready = false;
        let start = performance.now(), last = start;
        let titleVisibleAt: number | null = null;
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
            const assembled = loading.stage === "ASSEMBLED";
            if (assembled && callbacks.current.heroReady && titleVisibleAt === null) titleVisibleAt = now;
            poseProgress = reduced.matches ? 1 : heroPose(titleVisibleAt === null ? null : now - titleVisibleAt);
            buildProgress = reduced.matches ? 1 : 1 - loading.scatter;
            state.time.value = reduced.matches ? 0 : loading.driftTime;
            state.transition.value = reduced.matches ? 0 : assembled ? tabScatter : loading.scatter;
            state.illumination.value = reduced.matches ? 1 : loading.illumination;
            renderer.domElement.dataset.bootStage = reduced.matches ? "HERO_ACTIVE" : !assembled ? loading.stage :
              titleVisibleAt === null ? "TITLE_REVEAL" : poseProgress < 1 ? "HERO_ROTATION" : "HERO_ACTIVE";
            applyPose();
            let active = pointerActive && !reduced.matches;
            if (active) {
              caster.setFromCamera(ndc, camera);
              localRay.copy(caster.ray).applyMatrix4(inverse.copy(particles.matrixWorld).invert());
              active = localRay.intersectPlane(groundPlane, hit) !== null;
              if (active) state.pointer.value.lerp(hit, 1 - Math.exp(-18 * dt));
            }
            state.pointerActive.value += ((active ? 1 : 0) - state.pointerActive.value) * (1 - Math.exp(-12 * dt));
            // Baked SDF anchors stay immutable: field animation lives in positionNode.
            // This also leaves the assembled CRT completely static at transition=0.
            renderer.render(scene, camera);
            if (!ready && (reduced.matches || assembled)) { ready = true; callbacks.current.onReady(); }
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
              if (titleVisibleAt !== null) titleVisibleAt += now - hiddenAt;
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
