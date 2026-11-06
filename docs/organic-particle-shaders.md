# Stateless organic morphing

Complete vertex and fragment shaders are exported by
`src/components/webgl/organicParticleShaders.ts`. They use GLSL ES 1.00 and
`THREE.RawShaderMaterial` with `THREE.Points`. The live desktop renderer uses the
equivalent TSL expressions in `desktopCompute.ts`, because WebGPURenderer does
not support GLSL ShaderMaterial, even on its WebGL2 backend.

## GLSL setup

```ts
import * as THREE from "three";
import { organicParticleVertexShader, organicParticleFragmentShader }
  from "@/components/webgl/organicParticleShaders";

const geometry = new THREE.BufferGeometry();
// Equal-length Float32Arrays, stable particle correspondence, model-local space.
geometry.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));
geometry.setAttribute("targetPosition", new THREE.BufferAttribute(nextPositions, 3));
const material = new THREE.RawShaderMaterial({
  vertexShader: organicParticleVertexShader,
  fragmentShader: organicParticleFragmentShader,
  uniforms: {
    u_morphProgress: { value: 0 },
    u_morphCarry: { value: 0 },
    u_time: { value: 0 },
    u_mouse: { value: new THREE.Vector3() },
    u_mouseDirection: { value: new THREE.Vector3(0, 0, -1) },
    u_mouseActive: { value: 0 },
    u_pointerRadius: { value: .85 },
    u_pointerStrength: { value: .45 },
    u_pointSize: { value: 2 },
    u_pixelRatio: { value: Math.min(devicePixelRatio, 1.5) },
    u_opacity: { value: .15 },
  },
  transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, toneMapped: false,
});
const particles = new THREE.Points(geometry, material);
particles.frustumCulled = false; // shader displacement exceeds the base bounds
scene.add(particles);
```

Update `u_morphProgress` from 0 to 1 over 1000ms using visible elapsed time.
Set `u_time` in seconds; do not stop it at assembly completion. No velocity
attributes, FBOs, simulation textures, compute passes or per-particle writes are
needed. Dispose geometry/material and cancel the RAF on React effect cleanup.

## Motion and input

The base path uses smoothstep acceleration and deceleration. Two analytic curl
octaves and a lift term bend it, multiplied by
`carry*(1-smoothstep(p)) + .22*16*p*p*(1-p)*(1-p)`. With carry zero, both endpoints
are exact. This is procedural curl turbulence and collision-like deflection,
not pairwise collision detection or an integrated gravitational simulation.

The CPU maps CSS pointer coordinates to NDC, casts a camera ray, intersects a
camera-facing plane through the object center, and converts that hit and the ray
direction to model-local space. Set `u_mouse` to the hit and `u_mouseDirection`
to the normalized direction. Smooth the hit and `u_mouseActive` with exponential
damping; release/leave/blur fades active to zero. Refresh the ray every frame so
rotation, translation, resize and terminal zoom remain correct under a stationary
cursor. The exact implementation is in `DesktopParticleMonitor.tsx`.

Repulsion measures perpendicular distance to this ray, so the cursor influences
particles at every depth. The shader adds radial displacement and small tangential
turbulence **after** computing the morphed position. It never multiplies interaction
by morph progress. Orange intensity follows this same influence; idle is cyan.
The pointer can therefore displace an otherwise completed target. Completion
means the underlying shape and pose reached their destination, not pointer idle.

## Interrupted transitions and memory

The active app keeps three immutable shape attributes and constant-size CPU
uniform state. Retargeting snapshots the current three weights, pose and scalar
curvature. The new curvature envelope starts at that value, avoiding a snap when
its progress restarts at zero. It remains bounded even under repeated interrupts.
No per-particle position history is allocated. The removed position/velocity
buffers save 32 bytes per particle before backend-specific buffer overhead.

For the two-attribute GLSL variant, `position` must be the **unwarped current base**
when restarting a transition; `u_morphCarry` is its current curvature amplitude.
Do not bake pointer displacement or curl into it, which would apply them twice.
The app's three-cloud weight approach avoids this CPU buffer rebake altogether.

Reference: [Three.js WebGPURenderer material support](https://threejs.org/manual/pages/webgpurenderer).

## Verification

`node --test src/components/webgl/*.test.mjs` includes envelope endpoint and repeated
interruption checks. With a local Chromium listening on remote-debugging port 9333,
run `node scripts/verify-organic-shaders.mjs` (optional first argument: CDP HTTP URL).
It compiles the shipped GLSL pair, then uses test-only transform feedback to verify
exact endpoints, curved paths, additive hover at 0/.5/1, finite center behavior,
release, retarget continuity and independence from frame history. The application
itself uses no transform feedback or GPU readbacks.

The production build was also checked in Chromium's WebGL2 backend: all four
tabs complete before mounting their content, rapid retargeting preserves that
gate, and pointer hover produces orange pixels in the integrated TSL material.
These are correctness checks, not a frame-time guarantee for every GPU.
