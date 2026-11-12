/** Complete GLSL ES 1.00 shaders for THREE.RawShaderMaterial + THREE.Points.
 * Both position attributes are immutable local-space surface samples.
 * The live WebGPURenderer uses the equivalent TSL math in desktopCompute.ts.
 */
export const organicParticleVertexShader = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec3 targetPosition;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float u_morphProgress;
uniform float u_morphCarry;
uniform float u_time;
uniform vec3 u_mouse;
uniform vec3 u_mouseDirection;
uniform float u_mouseActive;
uniform float u_pointerRadius;
uniform float u_pointerStrength;
uniform float u_pointSize;
uniform float u_pixelRatio;
varying float v_interaction;

// Exact curl of A=(sin(y)cos(z), sin(z)cos(x), sin(x)cos(y)).
// Two octaves approximate smooth curl noise without texture fetches.
vec3 curl(vec3 p) {
  return vec3(
    -sin(p.x)*sin(p.y)-cos(p.z)*cos(p.x),
    -sin(p.y)*sin(p.z)-cos(p.x)*cos(p.y),
    -sin(p.z)*sin(p.x)-cos(p.y)*cos(p.z)
  );
}
vec3 flow(vec3 p) {
  return (curl(p) + .35*curl(p*2.13+vec3(5.2,1.3,7.1)))*.25;
}
void main() {
  float p = clamp(u_morphProgress, 0.0, 1.0);
  float eased = p*p*(3.0-2.0*p);
  float envelope = u_morphCarry*(1.0-eased)+.22*16.0*p*p*(1.0-p)*(1.0-p);
  vec3 base = mix(position, targetPosition, eased);
  vec3 field = flow(base*1.7+u_time*.22);
  // Smooth acceleration/capture plus bounded lift and collision-like deflection.
  vec3 reordered = base + (field+vec3(0.0,.45,0.0))*envelope;

  // Local-space ray cylinder: hover reaches all visible depths of the model.
  vec3 ray = u_mouseDirection/max(length(u_mouseDirection), .0001);
  vec3 delta = reordered-u_mouse;
  vec3 away = delta-ray*dot(delta,ray);
  float distanceToMouse = length(away);
  float radius = max(u_pointerRadius, .0001);
  float influence = (1.0-smoothstep(0.0,radius,distanceToMouse))*clamp(u_mouseActive,0.0,1.0);
  vec3 radial = away/max(distanceToMouse, .04);
  vec3 tangent = field-ray*dot(field,ray);
  // Crucially NOT multiplied by morph progress, build progress or envelope.
  vec3 displaced = reordered + (radial*u_pointerStrength+tangent*.06)*influence;
  v_interaction = influence;
  vec4 view = modelViewMatrix*vec4(displaced,1.0);
  gl_Position = projectionMatrix*view;
  gl_PointSize = clamp(u_pointSize*u_pixelRatio*8.0/max(-view.z,.1),1.0,8.0);
}
`;

export const organicParticleFragmentShader = /* glsl */ `
precision highp float;
uniform float u_opacity;
varying float v_interaction;
void main() {
  // Crisp square pixels. RGB is display-referred; use toneMapped:false.
  vec3 cyan = vec3(102.0,255.0,255.0)/255.0;
  vec3 orange = vec3(255.0,102.0,0.0)/255.0;
  gl_FragColor = vec4(mix(cyan,orange,clamp(v_interaction,0.0,1.0)),u_opacity);
}
`;
