# Mobile video assets — not yet supplied

The component is implemented, but this repository contains no production video
encodes. Add a seamless portrait loop in these formats, or pass a sources array to
MobileParticleVideo with your own same-origin or CORS-enabled CDN URLs:

- talos-mobile-av1.mp4: AV1, 8-bit Main profile.
- talos-mobile-hevc.mp4: HEVC, 8-bit Main profile, hvc1 sample entry.
- talos-mobile-h264.mp4: H.264 compatibility fallback.

Default descriptors assume 720x1280, 30fps SDR, approximately 1.8 Mbps for AV1/HEVC
and 2.5 Mbps for H.264. Update the MIME codec strings, dimensions, frame rate and
bitrate in particleVideoSources to match the delivered encodes. Use no audio track,
MP4 fast start, and matching first/last frames for a seamless forward loop. Native
looping is not guaranteed gapless on every decoder.

The optional poster prop supplies a still frame for blocked or failed playback.
Without video assets, the background remains #050914 and the UI is allowed to load;
the application never restarts a particle simulation to cover this case.

The browser ranks playable encodes using MediaCapabilities.decodingInfo, preferring
power-efficient and smooth candidates. This is an estimate, not an API to force
hardware decoding. Verify final encodes on physical Android and iOS devices.
Cross-origin media requires Access-Control-Allow-Origin to allow texture uploads.

The video stays in the on-screen DOM with zero opacity, not display:none, and its
decoded frames feed a WebGL1 quad. If WebGL fails or loses its context, the same
video becomes visible as native HTML video. The overlay uses two triangles, one
RGBA8 texture, no FBOs, DPR <= 1.25 and at most 1280 pixels on its longest side.

Touch/wheel velocity accumulates bounded intent that decays exponentially. Playback
smoothly moves between 1x and 1.5x, always forward. Input never assigns currentTime.
Tab changes do not seek, replace or restart the mobile loop. Touch ripple strength
and flow are separate shader uniforms. Only gestures targeting the canvas cancel
native scrolling; scrollable UI content keeps its normal behavior.

Video-frame callbacks mark uploads dirty. Ripples can redraw at display refresh
without re-uploading video. Hidden pages pause playback/rendering; reduced-motion
users see a still frame without distortion.

Verification used a synthetic VP9/WebM fixture, not production AV1/HEVC footage.
Checks covered playback-rate response, touch coordinates, portrait cover mapping,
zero JavaScript seeks, zero FBOs, native fallback, missing files, context loss,
visibility pause and reduced motion. Hardware decoding and final footage quality
remain unverified until the assets are supplied.
