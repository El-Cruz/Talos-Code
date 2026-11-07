# Unified SVG + Canvas 2D scene

`ParticleMonitor.tsx` is the only renderer mounted by the landing. Every device uses
SVG contours and a transparent full-viewport Canvas 2D over `#050914`. There is no
GPU tier selection, video playback, perspective camera, or device-specific scene.
The older WebGPU, projected canvas and video modules are retained as unmounted
legacy code; they are not imported by the landing renderer.

## Shared scene

`unifiedScene.ts` owns PC, database and atom polylines, particle samples, layout,
transition state and pointer response. SVG renders the same polylines sampled by
Canvas. SVG coordinates are serialized to three decimal places to avoid differing
trigonometric rounding between server and browser during hydration.

All shapes use a 480 by 440 coordinate system. The PC contains the entire monitor,
stand, base and keyboard, stacked vertically. `sceneLayout` fits this complete
space inside the available viewport instead of zooming/cropping Terminal.
`screenBounds` derives the HTML Terminal rectangle from the exact same screen
geometry and transform. Its contents scroll when the available screen is small.

On desktop, SYSTEM/ARCHIVE sit to the right of content and CORE to the left.
On narrow screens those shapes sit above content. Terminal uses the central
available area on every device. Resizing updates both render surfaces and HTML
screen bounds without restarting the animation or remounting tab content.
Depth is suggested by the CRT side panel, keyboard perspective, particle sizes,
scale and bounded parallax. Terminal settles without parallax so the input stays
aligned to the glass.

## Timing and input

Boot uses `bootState`: destroyed 0–500 ms, ignition 500–850 ms, assembly through
2350 ms, then UI reveal. All devices use the same visible-time clock. Hidden tabs
pause requestAnimationFrame and exclude hidden time. The header and navigation
remain usable throughout subsequent morphs.

Each tab morph lasts 1000 ms with smoothstep interpolation. A new request samples
the visible mixture before retargeting; both geometry and layout interpolate from
that mixture. Curved particle travel depends on the mixture, so interrupting a
transition does not reset the curve. Only the latest completed request ID permits
the content to mount.

Boot/morph positions are computed first, then pointer offsets are added. Passive
window PointerEvent listeners observe mouse and touch even over HTML controls;
there is no pointer capture, preventDefault or touch-action override. Release,
cancel, pointer leave and blur restore particles exponentially. Reduced motion
skips boot and morph animation, repulsion and parallax, including when the
preference changes at runtime.

## Adaptive drawing budget

The renderer measures requestAnimationFrame intervals over 1500 ms windows.
Sustained intervals above 23 ms lower quality; intervals below 18 ms recover it.
Quality ranges from .35 to 1: 1120–3200 particles and a DPR cap of 1.35–2.
Low-discrepancy sample ordering distributes every prefix across all contours.
Geometry, SVG detail, colors, interaction radius and timing never depend on budget.
SVG and content still work if a 2D context cannot be created.

OffscreenCanvas is optional and is not enabled in this implementation. There is
one main-thread drawing path; a worker can later consume the same geometry and
clock if measurements justify the added lifecycle and messaging complexity.

## Verification

- `node --experimental-strip-types --test src/components/webgl/*.test.mjs`
- `npx tsc --noEmit`
- `npx eslint src/App.tsx src/components/webgl/ParticleMonitor.tsx src/components/webgl/unifiedScene.ts`
- With a Next development server running, `node scripts/verify-unified-scene.mjs`.
  Set `PLAYWRIGHT_MODULE` to an existing Playwright module path when it is not
  installed locally, and optionally set `SCENE_URL` (default port 3001).
  Screenshots and results are written to `coverage/scene-verification`.

The browser script exercises 320×568, 390×844, 430×932, 768×1024, 1440×900 and
844×390 viewports, four tabs, delayed content, full Terminal bounds, input editing,
repulsion/release, rapid navigation, reduced motion and console errors.
These are desktop Edge tests with viewport/touch emulation, not measurements on
physical phones or tablets. Hardware-specific fluidity and Safari/iOS virtual
keyboard behavior still require real-device verification.

Production validation: `npm run build -- --webpack` completed successfully. The
standard Turbopack build encountered an environment process-start failure in its
CSS worker; the project default was not changed. The six local browser samples
on the production build were approximately 17.7–18.9 ms per frame at 3200
particles, not real-device claims. All 24 screenshots and the measurements are
saved in `coverage/scene-verification` (ignored by Git).
