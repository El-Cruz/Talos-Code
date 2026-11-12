# Organic Canvas 2D background

The active landing uses one Canvas 2D renderer on every device, with 1600 seeded
particles. No visible SVG contours or connecting lines remain. `organicCloud.ts`
samples projected PC surfaces, stacked database cylinders and atom orbits/nucleus
with a minimum separation. The PC screen stays empty for the HTML terminal.
Depth coordinates determine drawing order, luminosity, size and the PC side offset.

The scene uses canonical coordinates and a uniform viewport fit. Particle count,
seed, destinations, colors and timing are independent of viewport dimensions.
Pointer coordinates are converted back to canonical space. Passive Pointer Events
handle mouse/touch without capturing controls or preventing scrolling.

Organic drift follows damped springs at 120 Hz. Morphs last 1000 ms; interrupted
Hermite transitions retain the current weights and derivatives. Pointer offsets
are applied after morph/drift. A spatial grid separates close neighbours and caps
disk radii symmetrically to leave gaps even during dense morphs. Rendering quality
changes resolution and, under pressure, drawing frequency to 30 Hz, never count.
Simulation continues independently of skipped drawing. Hidden tabs pause. Reduced
motion settles immediately and disables drift, repulsion and parallax.

The latest completion ID gates tab content. Terminal bounds come from the same
layout as the particle monitor. Existing controlled email state is preserved.

Verification: `node --experimental-strip-types --test src/components/webgl/*.test.mjs`,
TypeScript, targeted ESLint and `npm run build -- --webpack`. Browser checks run
with `scripts/verify-unified-scene.mjs`; set PLAYWRIGHT_MODULE when using an external
Playwright installation and SCENE_URL for the local server. Captures and measurements
are saved under `coverage/scene-verification` and ignored by Git. Tests cover six
viewport sizes, boot/morph hover, browser-emulated touch, release, rapid navigation,
Terminal editing and reduced motion. These are desktop browser measurements;
physical phone/tablet performance and iOS keyboard behaviour remain to be checked.
