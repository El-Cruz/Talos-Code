"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { burstValue, loadingState, type BurstTransition } from "./burstTransition";
import { bakeWorkstation } from "./bakeWorkstation";
import { ParticleSimulation } from "./ParticleSimulation";
import { selectPerformanceTier } from "./performanceTier";
import { FluidSimulation } from "./FluidSimulation";
import { vertexShader, fragmentShader } from "./monitorShaders";
import { createPointerProjector, pointerToNDC } from "./pointerInteraction";

export function ParticleMonitor({ activeTab, onReady }: { activeTab: string; onReady: () => void }) {
  const readyCallback = useRef(onReady);
  useEffect(() => { readyCallback.current = onReady; }, [onReady]);
  const burstTransition = useRef<BurstTransition>({ start: -Infinity, from: 0 });
  const previousTab = useRef(activeTab);
  useEffect(() => {
    if (previousTab.current !== activeTab) {
      const now = performance.now();
      burstTransition.current = { start: now, from: burstValue(burstTransition.current, now) };
      previousTab.current = activeTab;
    }
  }, [activeTab]);
  const container = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2());
  const mouseActive = useRef(false);
  const prevMouse = useRef<{ point: THREE.Vector2; time: number } | null>(null);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const tier = selectPerformanceTier({
      width: window.innerWidth,
      cores: navigator.hardwareConcurrency,
      mobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches),
      memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    });
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); }
    catch (error) { console.warn("Particle monitor requires WebGL2", error); readyCallback.current(); return; }
    renderer.setClearColor(0x050914, 0);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.overscrollBehavior = "none";
    host.appendChild(renderer.domElement);
    let fluid: FluidSimulation | null = null;
    // WebGL2 supports float sampling natively; renderable float attachments need this extension.
    if (tier.name === "high" && renderer.extensions.has("EXT_color_buffer_float")) {
      try { fluid = new FluidSimulation(renderer, tier.fluidSize, tier.pressureIterations); }
      catch (error) { console.warn("[fluid] Initialization failed; fluid motion disabled; using direct repulsion.", error); }
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 8);
    const size = Math.min(tier.particleSize, renderer.capabilities.maxTextureSize), count = size * size;
    const { targets, normals, randoms } = bakeWorkstation(count);
    let texture: THREE.DataTexture | null = null;
    let simulation: ParticleSimulation | null = null;
    const geometry = new THREE.BufferGeometry();
    const targetAttribute = new THREE.BufferAttribute(targets, 3);
    geometry.setAttribute("position", targetAttribute);
    geometry.setAttribute("aTargetPos", targetAttribute);
    geometry.setAttribute("aTargetNormal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    if (fluid) {
      const data = new Float32Array(count * 4);
      const lookup = new Float32Array(count * 2);
      for (let i=0; i<count; i++) {
        data[i*4]=targets[i*3]; data[i*4+1]=targets[i*3+1]; data[i*4+2]=targets[i*3+2]; data[i*4+3]=randoms[i];
        lookup[i*2]=(i%size+.5)/size; lookup[i*2+1]=(Math.floor(i/size)+.5)/size;
      }
      texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
      texture.needsUpdate = true;
      try {
        simulation = new ParticleSimulation(renderer, texture);
        geometry.setAttribute("aLookup", new THREE.BufferAttribute(lookup,2));
      } catch (error) {
        console.warn("[particles] Using direct repulsion",error);
        fluid.dispose(); fluid=null; texture.dispose(); texture=null;
      }
    }
    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      defines: { ...(simulation ? { HIGH_PHYSICS: 1 } : {}), ...(tier.name === "mobile" ? { MOBILE_FRAGMENT: 1 } : {}) },
      // Vertex positions stay highp; only the mobile fragment opts into mediump.
      precision: "highp",
      uniforms: { uMotion: { value: 1 }, uMouse: { value: new THREE.Vector2() }, uMouseView: { value: new THREE.Vector3() }, uHoverRadius: { value: .65 }, uMouseStrength: { value: .18 }, uMouseActive: { value: 0 }, uOffsets: { value: null as THREE.Texture | null }, uTransitionProgress: { value: 1 }, uTime: { value: 0 }, uPixelRatio: { value: 1 },
        uDark: { value: new THREE.Color("#0A1128") }, uCyan: { value: new THREE.Color("#66FFFF") } },
      blending: THREE.AdditiveBlending, transparent: true, depthTest: true, depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // Positions are generated in the vertex shader.
    points.rotation.set(0.08, -0.35, 0);
    scene.add(points);
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height);
      material.uniforms.uPixelRatio.value = ratio;
      camera.aspect = width / height;
      camera.position.z = Math.max(9.5, 6.0 / camera.aspect);
      camera.lookAt(0, -0.45, 0);
      points.position.x = width > 768 ? 0.9 : 0;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let start = performance.now();
    let lastFrame = start;
    let ready = false;
    prevMouse.current = null; mouseActive.current = false;
    const modelView = new THREE.Matrix4();
    const projectPointer = createPointerProjector();
    let activeTouch: number | null = null;
    const strokes: { from: THREE.Vector2; to: THREE.Vector2; force: THREE.Vector2 }[] = [];
    const resetPointer = () => { prevMouse.current = null; mouseActive.current = false; activeTouch = null; };
    const updatePointer = (clientX: number, clientY: number) => {
      if (document.hidden || reducedMotion.matches) return;
      const rect = renderer.domElement.getBoundingClientRect(), now = performance.now();
      if (!pointerToNDC(clientX, clientY, rect, mouse.current)) { resetPointer(); return; }
      mouseActive.current = true;
      if (!fluid) return; // No stroke allocations or fluid work on lower tiers.
      const point = mouse.current.clone().multiplyScalar(.5).addScalar(.5);
      const previous = prevMouse.current;
      if (previous && now-previous.time < 150) {
        const force = point.clone().sub(previous.point).divideScalar(Math.max((now-previous.time)/1000, 1/240)).clampLength(0, 2);
        if(strokes.length<32) strokes.push({ from: previous.point, to: point, force });
      }
      prevMouse.current = { point, time: now };
    };
    const onPointer = (event: PointerEvent) => {
      // Touch Events handle fingers once; do not double-splat their Pointer Events.
      if (event.pointerType !== "touch" && activeTouch === null) updatePointer(event.clientX, event.clientY);
    };
    const endPointer = (event: PointerEvent) => { if (event.pointerType === "pen") resetPointer(); };
    const cancelPointer = (event: PointerEvent) => { if (event.pointerType !== "touch") resetPointer(); };
    const onTouch = (event: TouchEvent) => {
      if (activeTouch === null) {
        activeTouch = event.changedTouches[0]?.identifier ?? null;
        prevMouse.current = null;
      }
      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        if (touch.identifier === activeTouch) { updatePointer(touch.clientX, touch.clientY); break; }
      }
    };
    const endTouch = (event: TouchEvent) => {
      for (let i = 0; i < event.touches.length; i++) {
        if (event.touches[i].identifier === activeTouch) return;
      }
      resetPointer();
    };
    const preventCanvasScroll = (event: TouchEvent) => { if (event.cancelable) event.preventDefault(); };
    window.addEventListener("pointermove", onPointer, { passive: true, capture: true });
    window.addEventListener("pointerdown", onPointer, { passive: true, capture: true });
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", cancelPointer);
    window.addEventListener("touchstart", onTouch, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouch, { passive: true, capture: true });
    window.addEventListener("touchend", endTouch, { passive: true, capture: true });
    window.addEventListener("touchcancel", endTouch, { passive: true, capture: true });
    renderer.domElement.addEventListener("touchstart", preventCanvasScroll, { passive: false });
    renderer.domElement.addEventListener("touchmove", preventCanvasScroll, { passive: false });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("pointerleave", resetPointer);
    const animate = () => {
      if (document.hidden) return;
      const now = performance.now();
      const dt = Math.min((now-lastFrame)/1000, 1/30); lastFrame = now;
      for (const stroke of strokes) {
        fluid?.splat(stroke.from, stroke.to, stroke.force, camera.aspect);
      }
      strokes.length = 0;
      fluid?.step(dt);
      points.updateMatrixWorld(); camera.updateMatrixWorld();
      material.uniforms.uMouse.value.copy(mouse.current);
      const hit = !simulation && mouseActive.current
        ? projectPointer(mouse.current, camera, points.matrixWorld, material.uniforms.uMouseView.value)
        : true;
      const active = mouseActive.current && hit && !reducedMotion.matches ? 1 : 0;
      material.uniforms.uMouseActive.value += (active-material.uniforms.uMouseActive.value)*(1-Math.exp(-45*dt));
      material.uniforms.uMotion.value = reducedMotion.matches ? 0 : 1;
      const time = reducedMotion.matches ? 0 : (now-start)/1000;
      const loading = loadingState(now-start);
      if (!ready && (loading.stage === "UI_ACTIVE" || reducedMotion.matches)) { ready = true; readyCallback.current(); }
      const burst = reducedMotion.matches ? 0 : loading.stage === "UI_ACTIVE" ? burstValue(burstTransition.current, now) : loading.progress;
      material.uniforms.uTransitionProgress.value = burst;
      material.uniforms.uTime.value = time;
      modelView.multiplyMatrices(camera.matrixWorldInverse, points.matrixWorld);
      if (simulation && fluid) {
        material.uniforms.uOffsets.value = simulation.step(reducedMotion.matches ? 0 : dt, time, burst, fluid.velocityTexture, modelView, camera.projectionMatrix);
      }
      renderer.render(scene, camera);
    };
    let hiddenAt: number | null = document.hidden ? performance.now() : null;
    const onVisibility = () => {
      resetPointer(); strokes.length = 0;
      if (document.hidden) {
        hiddenAt = performance.now();
        renderer.setAnimationLoop(null);
      } else {
        const now = performance.now();
        if (hiddenAt !== null) {
          start += now - hiddenAt;
          // Freeze loading and transitions without a large time jump on resume.
          if (Number.isFinite(burstTransition.current.start)) {
            burstTransition.current.start += now - Math.max(hiddenAt, burstTransition.current.start);
          }
        }
        hiddenAt = null; lastFrame = now;
        renderer.setAnimationLoop(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) renderer.setAnimationLoop(animate);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer, true);
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", cancelPointer);
      window.removeEventListener("touchstart", onTouch, true);
      window.removeEventListener("touchmove", onTouch, true);
      window.removeEventListener("touchend", endTouch, true);
      window.removeEventListener("touchcancel", endTouch, true);
      renderer.domElement.removeEventListener("touchstart", preventCanvasScroll);
      renderer.domElement.removeEventListener("touchmove", preventCanvasScroll);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      simulation?.dispose(); fluid?.dispose();
      observer.disconnect();
      renderer.setAnimationLoop(null);
      geometry.dispose(); material.dispose(); texture?.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={container} className="h-full w-full" />;
}
