"use client";

import { useEffect, useRef } from "react";

// One full-screen fragment shader: no particles, no simulation passes, no three.js.
// Cost is bounded by MAX_PIXELS and FRAME_INTERVAL regardless of screen size.
const MAX_PIXELS = 600_000;
const FRAME_INTERVAL = 1000 / 30;

const VERTEX = `attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;
uniform vec2 uPointer;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float amplitude = 0.5, sum = 0.0;
  for (int i = 0; i < 4; i++) { sum += amplitude * noise(p); p = p * 2.03 + vec2(11.7, 5.3); amplitude *= 0.5; }
  return sum;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float aspect = uResolution.x / uResolution.y;
  float t = uTime * 0.03;
  vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0);
  float reach = exp(-dot(p - pointer, p - pointer) * 3.0);
  vec2 s = p * 1.25 + vec2(0.0, uScroll * 0.35) + (p - pointer) * reach * 0.12;

  // Domain-warped noise: folded metal that drifts slowly.
  vec2 q = vec2(fbm(s + t), fbm(s + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(s + 2.2 * q + vec2(1.7, 9.2) + t * 0.6), fbm(s + 2.2 * q + vec2(8.3, 2.8) - t * 0.4));
  float f = fbm(s + 2.4 * r);

  // Fold lines, like the layers of forged metal.
  float fold = abs(fract(f * 13.0) - 0.5);
  float lines = smoothstep(0.075, 0.0, fold);
  float vein = exp(-abs(f - 0.47) * 55.0);

  vec3 basalt = vec3(0.020, 0.020, 0.027);
  vec3 bronze = vec3(0.060, 0.330, 0.520);
  vec3 gold = vec3(0.220, 0.740, 0.970);
  vec3 patina = vec3(0.000, 0.700, 0.800);
  // The metal cools from bronze to patina as the page scrolls.
  vec3 metal = mix(bronze, patina, uScroll * 0.85);
  vec3 glow = mix(gold, vec3(0.55, 0.95, 1.0), uScroll * 0.85);

  float body = smoothstep(0.25, 0.85, f) * (0.35 + 0.65 * r.x);
  vec3 color = basalt + metal * body * 0.22;
  color += metal * lines * (0.18 + 0.5 * body);
  color += glow * vein * 0.55;

  // Keep the reading side (left) calm, let the metal show on the right; dim behind content.
  float side = smoothstep(-0.55 * aspect, 0.35 * aspect, p.x);
  float exposure = mix(0.22, 1.0, side) * mix(1.0, 0.38, uScroll);
  color = basalt + (color - basalt) * exposure;
  color *= 1.0 - 0.35 * dot(p, p) / (aspect * aspect * 0.25 + 0.25);
  color += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.022;
  gl_FragColor = vec4(color, 1.0);
}`;

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.warn("[forge] shader", gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null; }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.warn("[forge] link", gl.getProgramInfoLog(program)); return null; }
  return program;
}

export function ForgeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!gl) return; // The CSS gradient on the canvas stays as the fallback.

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let uniforms: Record<"uResolution" | "uTime" | "uScroll" | "uPointer", WebGLUniformLocation | null> | null = null;
    const setup = () => {
      const program = createProgram(gl);
      if (!program) { uniforms = null; return; }
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = {
        uResolution: gl.getUniformLocation(program, "uResolution"),
        uTime: gl.getUniformLocation(program, "uTime"),
        uScroll: gl.getUniformLocation(program, "uScroll"),
        uPointer: gl.getUniformLocation(program, "uPointer"),
      };
    };
    setup();

    const pointer = { x: 0.7, y: 0.5, targetX: 0.7, targetY: 0.5 };
    let scroll = 0, elapsed = 0, lastFrame = 0, frame = 0, dirty = true;

    const resize = () => {
      const width = window.innerWidth, height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, Math.sqrt(MAX_PIXELS / Math.max(1, width * height)));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      dirty = true;
    };
    const scrollTarget = () => Math.min(1, window.scrollY / Math.max(1, window.innerHeight * 0.9));

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const delta = now - lastFrame;
      if (delta < FRAME_INTERVAL) return;
      lastFrame = now;
      const still = reducedMotion.matches;
      if (!still) elapsed += Math.min(delta, 100) / 1000;
      const target = scrollTarget();
      const nextScroll = still ? target : scroll + (target - scroll) * 0.12;
      if (Math.abs(nextScroll - scroll) > 0.0005) { scroll = nextScroll; dirty = true; }
      pointer.x += (pointer.targetX - pointer.x) * 0.06;
      pointer.y += (pointer.targetY - pointer.y) * 0.06;
      if (!uniforms || (still && !dirty)) return;
      dirty = false;
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, still ? 12 : 12 + elapsed);
      gl.uniform1f(uniforms.uScroll, scroll);
      gl.uniform2f(uniforms.uPointer, still ? 0.7 : pointer.x, still ? 0.5 : pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const start = () => { if (!frame && !document.hidden) { lastFrame = 0; frame = requestAnimationFrame(render); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };

    const onVisibility = () => { if (document.hidden) stop(); else { dirty = true; start(); } };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.targetX = event.clientX / window.innerWidth;
      pointer.targetY = 1 - event.clientY / window.innerHeight;
    };
    const onLost = (event: Event) => { event.preventDefault(); stop(); };
    const onRestored = () => { setup(); resize(); start(); };
    const onMotionChange = () => { dirty = true; };

    resize();
    start();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    reducedMotion.addEventListener("change", onMotionChange);
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="forge-canvas fixed inset-0 -z-10 h-full w-full" />;
}
