export const mobileVideoVertexShader = /* glsl */ `
precision mediump float;
attribute vec2 aPosition;
varying mediump vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const mobileVideoFragmentShader = /* glsl */ `
precision mediump float;
uniform sampler2D uVideo;
uniform vec2 uPointer;       // Screen UV, bottom-left origin; same mapping for touch/mouse.
uniform vec2 uFlow;
uniform vec2 uCover;         // object-fit: cover, applied AFTER screen-space distortion.
uniform float uAspect;
uniform float uPhase;        // CPU wraps phase to [0, 2 PI] for mediump stability.
uniform float uStrength;
varying mediump vec2 vUv;
void main() {
  vec2 metric = vec2(uAspect, 1.0);
  vec2 delta = (vUv - uPointer) * metric;
  float radius = length(delta);
  vec2 normal = delta / max(radius, 0.001);
  float falloff = 1.0 - smoothstep(0.02, 0.22, radius);
  float wave = sin(radius * 65.0 - uPhase) * exp(-radius * 12.0);
  vec2 eddy = vec2(sin(delta.y * 27.0 + uPhase), cos(delta.x * 31.0 - uPhase));
  vec2 offset = (normal * wave * 0.009 + eddy * 0.002 + uFlow * 0.004)
              / metric * falloff * uStrength;
  vec2 sampleUv = (vUv + offset - 0.5) * uCover + 0.5;
  gl_FragColor = texture2D(uVideo, clamp(sampleUv, vec2(0.001), vec2(0.999)));
}`;
