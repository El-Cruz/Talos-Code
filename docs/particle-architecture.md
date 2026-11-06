# Desktop TSL compute and Tier 3 video rendering

ParticleMonitor.tsx uses useRenderingTier and lazy-loads DesktopParticleMonitor.tsx
for tiers 1 and 2. Tier 3 now uses TabParticleCanvas.tsx to project all three tab
shapes on a 2D canvas. See tab-morphing.md for the active navigation and completion
contract. MobileParticleVideo and MobileParticleCanvas remain standalone fallbacks;
see public/media/README.md for the retained video API.
The old FluidSimulation and
ParticleSimulation classes are no longer imported by the active rendering components.

| Route | Backend | Count | Simulation |
| --- | --- | ---: | --- |
| High desktop | WebGPU | 1,048,576 | Static anchors and vertex field animation |
| Standard desktop | WebGPU | 262,144 | Same TSL material |
| Desktop without WebGPU | WebGLBackend | At most 262,144 | Same TSL material; TF initialization |
| Tier 3 / desktop initialization failure | Canvas 2D | 2,400 points | Perspective projection and tab shape interpolation |

## Initialization and ownership

Await renderer.init() before dispatching compute or rendering. Three.js r187
automatically attempts WebGLBackend if WebGPU initialization fails. The React effect
checks cancellation after asynchronous initialization and compilation, preventing
orphan canvases/loops during Strict Mode or unmount. GPU loss and uncaptured errors
stop the desktop loop and select the Tier 3 projected canvas path.

desktopCompute.ts allocates positions and velocities with instancedArray(count,
'vec4'). A third immutable vec4 buffer holds baked anchors and seeds. Initialization
seeds positions and clears velocities. Boot animation now runs in the material's
positionNode against immutable positions, with no per-frame compute dispatch,
CPU simulation uploads or production readbacks. A separate immutable vec4 buffer
contains independent ground-plane XZ coordinates, assembly delay and phase.

## Boot timeline

`bootState(ageMs)` starts after GPU compilation and uses visible elapsed time:

| Elapsed | Phase | Behavior |
| --- | --- | --- |
| 0–500ms | Destroyed | All fragments lie on the ground at local Y = -2.15 |
| 500–850ms | Ignition | Staggered cyan/orange illumination |
| 850–2350ms | Assembling | Staggered arcs lift fragments into the frontal CRT |
| After assembly | Title reveal | UI fades in over 600ms; wait for document.fonts.ready |
| After title reveal | Hero rotation | 1000ms smooth turn to X=0.38, Y=-0.55 radians |
| Afterwards | Hero active | Static top-lateral CRT |

`bootState(ageMs)` and `heroPose(titleAgeMs)` are pure functions. Per-particle
assembly delays and vertical arcs run in the TSL material; fragment positions are
never uploaded per frame. Low-amplitude drift and bounded radial repulsion remain
on the ground plane. The camera begins above the debris and becomes frontal by
assembly completion. The separate hero clock starts only after the real UI fade
and fonts readiness, so slow title loading cannot trigger rotation early.

The exact React orchestration lives in `src/hooks/useHeroReveal.ts`:

```tsx
useEffect(() => {
  if (!assembled) return;
  let cancelled = false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finish = () => {
    if (!titleRevealed && !reduced.matches) return;
    void document.fonts.ready.then(() => {
      if (!cancelled) setHeroReady(true);
    });
  };
  finish();
  reduced.addEventListener("change", finish);
  return () => {
    cancelled = true;
    reduced.removeEventListener("change", finish);
  };
}, [assembled, titleRevealed]);
```

App.tsx sets `assembled` from the renderer's `onReady` callback and
`titleRevealed` from the UI layer's opacity `transitionend`. `heroReady` is passed
through ParticleMonitor without recreating the renderer. The animation effect
in DesktopParticleMonitor reads it from a ref, starts the hero clock, and applies
`heroPose(elapsed)` to object rotation. Its cleanup cancels RAF and listeners.
Hidden time is excluded from both clocks; reduced motion skips assembly and turn.

Below 768px, the visual occupies the top portion below navigation, with tab copy
below it. Terminal overlays its panel inside the enlarged monitor. The retained
standalone video component cannot execute these dynamic shape morphs.

## Retained optional compute kernel (not dispatched during boot)

Each invocation accesses only element(instanceIndex). Both inputs are snapshotted
before either output is written. There are no neighboring reads, atomics, workgroup
memory, barriers or simulation textures. WGSL updates these buffers in-place.
Transform Feedback cannot read and write the same physical buffer; Three.js manages
alternating GPU buffers internally. These are buffers, not ping-pong FBO textures.

The motion field is an analytic curl of a trigonometric vector potential with two
octaves. This supplies smooth 3D turbulence, not a pressure/grid fluid solver.
Foreground particles evaluate the rounded-box workstation SDF: monitor casing minus
screen aperture, unioned with stand, keyboard and mouse. Central differences estimate
the surface normal; a strong normal spring and weak baked-anchor tether stabilize
the shape. Ambient particles omit the SDF. Pointer repulsion, exponential damping,
a velocity limit and dt <= 1/60 bound motion. Tab/loading transitions remain an eased
galaxy interpolation in positionNode. The active boot path uses the static baked
anchors and bounded analytic field above instead of this flow kernel, so the
completed CRT does not drift.

## Rendering and input

SpriteNodeMaterial.positionNode reads positions.toAttribute().xyz. Instanced sprites
retain visible particle size across backends: WebGPU native points are fixed to one
pixel. The material adds a circular falloff, additive color and density-adjusted
opacity. Depth testing is enabled, depth writes disabled and DPR capped to 1.5.

Desktop global Pointer Events cover mouse, pen and touch. The three-box CPU raycast
returns view coordinates, converted to model coordinates for compute. There is no
CPU point-cloud picking. Mobile uses canvas-scoped Pointer Events with capture. Hidden documents
pause the loop and freeze loading/transition clocks.

## Secondary canvas fallback (missing or unsupported videos)

`MobileParticleCanvas` is a Next.js Client Component using `useRef` and `useEffect`.
A detached 480 × 360 canvas draws a CRT shell, screen, stand and keyboard. One
`getImageData` call per mount samples a 6px grid where alpha exceeds 128. Only those
samples become particles with immutable `hx`/`hy` home coordinates; resizing remaps
the cached samples without another pixel read. The grid bounds the particle count
below 4,800 regardless of viewport size, and backing-store DPR is capped at 1.5.

Particles are sharp cyan (`#66FFFF`) squares on `#050914`; displacement switches
them to orange (`#FF6600`). Two color batches avoid per-particle style changes.
Fixed 1/60-second spring steps, damping and a 50ms catch-up cap keep behavior stable
across refresh rates and stalls. Touch, pen and primary-button mouse drags repel
particles radially, including a guard against zero-distance division.

The initial image is static with `awake = false`. Input wakes the loop; after
release, settled particles snap exactly home and the final frame stops scheduling
`requestAnimationFrame`. IntersectionObserver and document visibility cancel
pending frames, releasing captured input and resuming only unfinished motion.
Reduced motion keeps the illustration static. Cleanup disconnects observers,
removes listeners and cancels frames, including React Strict Mode remounts.

The canvas fills its parent and accepts a Tailwind `className`. Give the parent an
explicit height (for example `h-96`) when using it outside the full-screen app:

```tsx
import { MobileParticleCanvas } from "@/components/webgl/MobileParticleCanvas";

<div className="h-96 w-full">
  <MobileParticleCanvas />
</div>
```

The optional `onReady` callback runs after the first nonzero-size draw and should
only be passed from another Client Component. The illustration is decorative and
hidden from assistive technology. `touch-action: none` applies only to the canvas;
the app's overlaid controls retain their own input handling.

## Validation and limits

TypeScript, ESLint, 17 particle-related tests and the Next.js Webpack production
build pass. The default Turbopack build fails while starting its CSS worker in
this environment; the successful build used `next build --webpack`.
Headless Chromium mobile-emulation checks against that build verified 2D-only
contexts, one mask read per mount, the DPR cap, touch displacement and orange
coloring, pixel-identical return home, zero queued RAFs at rest and off-screen,
intersection resume, touch cancellation, simulated document visibility changes,
reduced motion and landscape resizing. No browser exceptions were reported.

The boot browser check exercises the WebGL2 material, floor/ignition/assembly,
frontal title reveal and delayed hero rotation without shader or browser errors.
Timeline tests cover continuity and title-gated rotation. Mobile checks compare
the visible title bounds with the model container.

Previous desktop checks (before this boot update):
Edge browser checks exercised WebGPU at 262,144 and 1,048,576 particles and the
automatic WebGLBackend fallback at 262,144, without shader errors.

A 1,024-particle GPU readback experiment over 120 steps produced identical positions
on the tested backends. Every particle moved, all values were finite, foreground
displacement stayed below 0.137 scene units and speed below 0.128 units/second.

These are correctness checks on this machine, not a universal 60fps guarantee.
Physical device/thermal benchmarking and measured runtime downgrades remain separate
work. Tests of the mobile video component used a synthetic VP9/WebM clip, verifying input, no seeks,
no FBOs, missing assets, native fallback, context loss and reduced motion. Hardware
decoding and the visual quality of final AV1/HEVC footage are unverified until those
assets exist. This does not claim to diagnose a specific Android driver issue.

Reference: [Three.js r187 compute example](https://github.com/mrdoob/three.js/blob/r187/examples/webgpu_compute_particles.html).
