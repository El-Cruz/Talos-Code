# Desktop TSL compute and mobile 2D canvas rendering

ParticleMonitor.tsx lazy-loads DesktopParticleMonitor.tsx for desktops. Mobile uses
MobileParticleCanvas.tsx: a CPU spring simulation drawn with Canvas 2D.
The previous MobileParticleVideo.tsx and its helpers remain available but are not
imported by the active fallback; mobile rendering requires no video assets or GPU API.
The old FluidSimulation and
ParticleSimulation classes are no longer imported by the active rendering components.

| Route | Backend | Count | Simulation |
| --- | --- | ---: | --- |
| High desktop | WebGPU | 1,048,576 | WGSL storage buffers |
| Standard desktop | WebGPU | 262,144 | Same WGSL kernel |
| Desktop without WebGPU | WebGLBackend | At most 262,144 | Same TSL kernel via Transform Feedback |
| Mobile / desktop initialization failure | Canvas 2D | Alpha-masked 6px grid | CPU springs and radial pointer repulsion |

## Initialization and ownership

Await renderer.init() before dispatching compute or rendering. Three.js r187
automatically attempts WebGLBackend if WebGPU initialization fails. The React effect
checks cancellation after asynchronous initialization and compilation, preventing
orphan canvases/loops during Strict Mode or unmount. GPU loss and uncaptured errors
stop the desktop loop and select the mobile canvas path.

desktopCompute.ts allocates positions and velocities with instancedArray(count,
'vec4'). A third immutable vec4 buffer holds baked anchors and seeds. Initialization
seeds positions and clears velocities. Each frame computes before drawing, with no
CPU simulation uploads or production readbacks.

## Kernel contract

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
galaxy interpolation in positionNode.

## Rendering and input

SpriteNodeMaterial.positionNode reads positions.toAttribute().xyz. Instanced sprites
retain visible particle size across backends: WebGPU native points are fixed to one
pixel. The material adds a circular falloff, additive color and density-adjusted
opacity. Depth testing is enabled, depth writes disabled and DPR capped to 1.5.

Desktop global Pointer Events cover mouse, pen and touch. The three-box CPU raycast
returns view coordinates, converted to model coordinates for compute. There is no
CPU point-cloud picking. Mobile uses canvas-scoped Pointer Events with capture. Hidden documents
pause the loop and freeze loading/transition clocks.

## Mobile canvas fallback

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

TypeScript, ESLint, all 12 existing unit tests and the Next.js Webpack production
build pass. The default Turbopack build fails while starting its CSS worker in
this environment; the successful build used `next build --webpack`.
Headless Chromium mobile-emulation checks against that build verified 2D-only
contexts, one mask read per mount, the DPR cap, touch displacement and orange
coloring, pixel-identical return home, zero queued RAFs at rest and off-screen,
intersection resume, touch cancellation, simulated document visibility changes,
reduced motion and landscape resizing. No browser exceptions were reported.

Previous desktop checks:
Edge browser checks exercised WebGPU at 262,144 and 1,048,576 particles and the
automatic WebGLBackend fallback at 262,144, without shader errors.

A 1,024-particle GPU readback experiment over 120 steps produced identical positions
on the tested backends. Every particle moved, all values were finite, foreground
displacement stayed below 0.137 scene units and speed below 0.128 units/second.

These are correctness checks on this machine, not a universal 60fps guarantee.
Physical device/thermal benchmarking and measured runtime downgrades remain separate
work. Historical tests of the unused mobile video component used a synthetic VP9/WebM clip, verifying input, no seeks,
no FBOs, missing assets, native fallback, context loss and reduced motion. Hardware
decoding and the visual quality of final AV1/HEVC footage are unverified until those
assets exist. This does not claim to diagnose a specific Android driver issue.

Reference: [Three.js r187 compute example](https://github.com/mrdoob/three.js/blob/r187/examples/webgpu_compute_particles.html).
