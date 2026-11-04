"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { burstValue, loadingState, type BurstTransition } from "./burstTransition";
import { PARTICLE_TEXTURE_SIZE, ParticleSimulation } from "./ParticleSimulation";
import { FluidSimulation } from "./FluidSimulation";
import { vertexShader, fragmentShader } from "./monitorShaders";

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
  const prevMouse = useRef<{ point: THREE.Vector2; time: number } | null>(null);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); }
    catch (error) { console.warn("Particle monitor requires WebGL2", error); readyCallback.current(); return; }
    renderer.setClearColor(0x050914, 0);
    host.appendChild(renderer.domElement);
    let fluid: FluidSimulation | null = null;
    // WebGL2 supports float sampling natively; renderable float attachments need this extension.
    if (renderer.extensions.has("EXT_color_buffer_float")) {
      try { fluid = new FluidSimulation(renderer); }
      catch (error) { console.warn("[fluid] Initialization failed; fluid motion disabled; using ambient curl fallback.", error); }
    } else {
      console.warn("[fluid] EXT_color_buffer_float unavailable; fluid advection disabled, using vertex animation fallback.");
    }
    const emptyFlow = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    emptyFlow.needsUpdate = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 8);
    const size = PARTICLE_TEXTURE_SIZE, count = size * size;
    const data = new Float32Array(count * 4);
    const lookup = new Float32Array(count * 2);
    const randoms = new Float32Array(count);
    // Seed all three objects so thin peripherals retain their share of the cloud.
    let seed = 42;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < count; i++) {
      randoms[i] = random();
      const object = random();
      const x = random() - 0.5, y = random() - 0.5, z = random() - 0.5;
      const origin = object < 0.72 ? [x * 3.4, y * 3.1 - 0.25, z * 2.1]
        : object < 0.94 ? [x * 2.5 - 0.12, y * 0.4 - 1.87, z * 1.1 + 1.35]
        : [x * 0.65 + 1.55, y * 0.45 - 1.82, z * 0.85 + 1.4];
      data.set([...origin, randoms[i]], i * 4);
      lookup.set([(i % size + 0.5) / size, (Math.floor(i / size) + 0.5) / size], i * 2);
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    let simulation: ParticleSimulation | null = null;
    if (renderer.extensions.has("EXT_color_buffer_float")) {
      try { simulation = new ParticleSimulation(renderer, texture); }
      catch (error) { console.warn("[particles] Using vertex fallback", error); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("aLookup", new THREE.BufferAttribute(lookup, 2));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: { uTransitionProgress: { value: 1 }, uDensity: { value: emptyFlow }, uFallback: { value: simulation ? 0 : 1 }, uPositions: { value: texture }, uTime: { value: 0 }, uPixelRatio: { value: 1 },
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
      const ratio = Math.min(window.devicePixelRatio, 2);
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
    const start = performance.now();
    let lastFrame = start;
    let ready = false;
    prevMouse.current = null;
    const modelView = new THREE.Matrix4();
    const strokes: { from: THREE.Vector2; to: THREE.Vector2; force: THREE.Vector2 }[] = [];
    const onPointer = (event: MouseEvent) => {
      if (reducedMotion.matches) return;
      const rect = renderer.domElement.getBoundingClientRect(), now = performance.now();
      if (!rect.width || !rect.height) return;
      // client coordinates and DOM bounds are both CSS pixels: DPR cancels in UV space.
      mouse.current.set((event.clientX-rect.left)/rect.width, 1-(event.clientY-rect.top)/rect.height);
      if (mouse.current.x < 0 || mouse.current.x > 1 || mouse.current.y < 0 || mouse.current.y > 1) { resetPointer(); return; }
      const point = mouse.current.clone();
      const previous = prevMouse.current;
      if (fluid && previous && now-previous.time < 150) {
        const force = point.clone().sub(previous.point).divideScalar(Math.max((now-previous.time)/1000, 1/240)).clampLength(0, 2);
        if(strokes.length<32) strokes.push({ from: previous.point, to: point, force });
      }
      prevMouse.current = { point, time: now };
    };
    const resetPointer = () => { prevMouse.current = null; };
    window.addEventListener("mousemove", onPointer, { passive: true, capture: true });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("pointerleave", resetPointer);
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min((now-lastFrame)/1000, 1/30); lastFrame = now;
      for (const stroke of strokes) {
        fluid?.splat(stroke.from, stroke.to, stroke.force, camera.aspect);
      }
      strokes.length = 0;
      fluid?.step(dt);
      material.uniforms.uDensity.value = fluid?.densityTexture ?? emptyFlow;
      const time = reducedMotion.matches ? 0 : (now-start)/1000;
      const loading = loadingState(now-start);
      if (!ready && (loading.stage === "UI_ACTIVE" || reducedMotion.matches)) { ready = true; readyCallback.current(); }
      const burst = reducedMotion.matches ? 0 : loading.stage === "UI_ACTIVE" ? burstValue(burstTransition.current, now) : loading.progress;
      material.uniforms.uTransitionProgress.value = burst;
      material.uniforms.uTime.value = time;
      points.updateMatrixWorld(); camera.updateMatrixWorld();
      modelView.multiplyMatrices(camera.matrixWorldInverse, points.matrixWorld);
      if (simulation) {
        material.uniforms.uPositions.value = simulation.step(reducedMotion.matches ? 0 : dt, time, burst, fluid?.velocityTexture ?? emptyFlow, modelView, camera.projectionMatrix);
      }
      renderer.render(scene, camera);
    });
    return () => {
      window.removeEventListener("mousemove", onPointer, true);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      simulation?.dispose(); fluid?.dispose(); emptyFlow.dispose();
      observer.disconnect();
      renderer.setAnimationLoop(null);
      geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={container} className="h-full w-full" />;
}
