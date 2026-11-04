# Hybrid particle rendering

The implementation uses one `THREE.Points` draw with static baked geometry on every
tier. `bakeWorkstation.ts` samples the monitor, keyboard and mouse once at mount;
no vertex shader evaluates an SDF, gradients or 3D curl noise.

| Tier | Particles | Physics | Fragment precision |
| --- | ---: | --- | --- |
| Mobile | 65,536 | Stateless vertex repulsion, no simulation targets | mediump |
| Standard | 262,144 | Stateless vertex repulsion, no simulation targets | highp |
| High | 1,048,576 | 128x128 fluid + 1024x1024 persistent position offsets | highp |

## Implementation plan and code map

1. Select an initial tier with `performanceTier.ts`; create the static
   `aTargetPos`, `aTargetNormal` and `aRandom` attributes in `ParticleMonitor.tsx`.
   Allocate `FluidSimulation` and `ParticleSimulation` only for High with supported
   float render targets. Failed initialization selects vertex repulsion. High
   retains the full fluid solve and reads the latest offset texture every frame.
2. Compile `monitorShaders.ts` with `HIGH_PHYSICS` only when simulation initialized.
   Lower tiers compile out all simulation samplers. Small sine waves supply idle
   motion; each frame starts from a baked target, so displacement cannot accumulate.
   Loading and tab transitions continue to interpolate between the workstation
   and the galaxy. Only the mobile fragment changes its default to `mediump`;
   vertex calculations stay `highp`, with matching explicit `mediump` varyings.
3. Feed both mouse/pen and touch through `pointerToNDC` in `pointerInteraction.ts`.
   Global capture listeners receive input even over the UI. Track one touch
   identifier and ignore its duplicate Pointer Events. Mutable refs bridge input
   to the frame loop without React updates. High converts NDC to UV and splats
   velocity lines; the fallback uses a CPU raycast against three simple proxy
   boxes, not against the point cloud.
4. Bound work with DPR <= 1.5, no antialiasing and a complete animation-loop pause
   while the document is hidden. Dispose targets, geometry, material, renderer and
   listeners on unmount. Canvas-only non-passive touch listeners prevent native
   gestures, while scrollable UI content keeps its normal touch behavior.

## Coordinate and shader contract

`uMouse` is NDC, `uMouseView` is the raycast point in camera/view coordinates.
Particles and the 3D hit use the same space, including the workstation's rotation
and translation. The proxy boxes approximate surfaces; they are not exact mesh
intersection tests. When no box is hit, a camera-facing plane supplies a position.
Ambient dust projects the pointer ray onto each particle's depth plane.

```ts
ndc.set(
  (clientX - rect.left) / rect.width * 2 - 1,
  1 - (clientY - rect.top) / rect.height * 2,
);
// client coordinates and rect are CSS pixels: no devicePixelRatio multiplication.
raycaster.setFromCamera(ndc, camera);
// High-tier fluid coordinates:
uv.copy(ndc).multiplyScalar(0.5).addScalar(0.5);
```

The fallback branch in `monitorShaders.ts` applies a radial normal to a bounded
3D distance field. `uHoverRadius = 0.65` and `uMouseStrength = 0.18` are in scene
units. Release fades `uMouseActive` exponentially, restoring targets immediately
without a simulation texture. This is a stateless visual approximation, not a
time-integrated spring or persistent fluid trail.

```glsl
vec3 pointer = ambient
  ? vec3(uMouse * (-view.z) /
         vec2(projectionMatrix[0][0], projectionMatrix[1][1]), view.z)
  : uMouseView;
vec3 away = view - pointer;
float distanceToPointer = length(away);
float influence = 1.0 - smoothstep(0.0, uHoverRadius, distanceToPointer);
vec3 radialNormal = away / max(distanceToPointer, 0.0001);
view += radialNormal * influence * influence
      * uMouseStrength * uMouseActive * uMotion;
```

NDC input follows the [Three.js Raycaster contract](https://threejs.org/docs/pages/Raycaster.html).
Canvas handlers explicitly set `passive: false` because passive listeners cannot
cancel default gestures; global observation remains passive. See
[MDN's listener options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).

## Validation and performance limits

Unit tests cover coordinate mapping with offset canvas bounds, out-of-bounds input,
and ray projection through transformed cameras/models, including peripherals.
Existing tests cover tier selection, baked geometry and transition timing.

An Edge/Playwright browser check exercised all three tiers at DPR 3 (capped to 1.5),
native touch start/move/end, mouse input, canvas-only scroll cancellation, shader
compilation, tab transitions and visibility pause/resume. Mobile and Standard
produced zero simulation passes/targets; High retained ten simulation targets and
twelve simulation passes at idle, plus splat passes during movement. Three.js also
owns three empty scratch framebuffer handles internally; these are not simulation
targets. No WebGL errors were observed. TypeScript, ESLint and the Next.js
production build passed.

These checks validate functionality, not a 60fps hardware claim. Width/CPU/memory
are initial heuristics, not a GPU benchmark. Before a universal 60fps claim, measure
the production build on physical iOS/Android and integrated-GPU laptops, including
sustained touch and thermal load. Track frame times against the 16.7ms budget;
calibrate particle counts/DPR or add measured runtime downgrades for devices that
miss it. Runtime quality downgrades are not implemented by this change.
