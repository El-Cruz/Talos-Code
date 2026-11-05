# Tier 3 video background

`MobileParticleVideo` is the active Tier 3 component selected by `useRenderingTier`.
The configured same-origin sources are:

- `/videos/tier3-loop-av1.mp4` — AV1 for supporting browsers, including Android/Chrome.
- `/videos/tier3-loop-hevc.mp4` — HEVC with an `hvc1` sample entry for supporting browsers, including iOS/Safari.

Place the actual encodes in `public/videos`, or pass a `sources` array with
CORS-enabled CDN URLs. These files are not present in this checkout. Default
capability descriptors assume 720×1280, 30fps, 1.8Mbps SDR; match these fields and
codec strings to the actual assets. Use silent seamless loops with MP4 fast start.
Selection uses canPlayType and MediaCapabilities rather than user-agent assumptions.
The native video is muted, playsInline and looped; failed autoplay retries on a
gesture. Supply `poster` for a still image before decoding.

The WebGL1 canvas covers the HTML video with a distorted video-texture quad and
12,000 independently seeded square particles. Movement is analytic in the vertex
shader: no per-frame particle buffers, CPU simulation, FBOs or Three.js. Particles
use cyan #66FFFF and orange #FF6600 near input. Screen-space UV distortion respects
object-fit: cover and aspect ratio. Pointer release fades the interaction. Existing
intent-based forward playback stays at 1–1.5× without seeking. Overlay work is
capped at 30fps, DPR 1 and a 960px longest side. Decoded-frame callbacks avoid
uploading the video texture on every draw.

IntersectionObserver and document visibility pause video and rendering. Reduced
motion displays a still frame. WebGL failure, context loss or an exceeded GPU
budget switches to native video. Exhausting both sources mounts the 2D CRT canvas.

## GPU budget

Where `EXT_disjoint_timer_query` is exposed, asynchronous queries sample video
texture upload and both draws every 30 rendered frames. Disjoint samples are
discarded. A sample above 4ms reduces resolution by 25%, down to 40% of the initial
scale. A further over-budget sample disables the overlay. Particle count remains
12,000 at every enabled resolution. Inspect canvas `data-gpu-timing`, `data-gpu-ms`
and `data-particle-count` attributes for diagnostics.

This is a reactive policy, not a universal 4ms guarantee: samples may exceed the
budget before adjustment, timers may be unavailable, and video decode/compositing
cost is outside these GL measurements. Physical mobile testing with real encodes
is required to establish the target. Timer semantics follow the
[Khronos specification](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query/).

## Validation

TypeScript, ESLint, 14 particle-related tests and the Next.js Webpack build pass.
Headless Chromium mobile emulation used an intercepted synthetic VP9/WebM fixture
at the configured URLs. It verified playback, 12,000-point draws, touch response,
no GL errors, off-screen pause/resume, reduced motion, context-loss native fallback
and missing-source 2D fallback. It does not validate AV1/HEVC decoding or physical
mobile GPU timing.
