const galaxyFunctions = /* glsl */ `
vec3 galaxyPosition(float seed, mat4 projection, float time) {
  vec3 random=fract(seed*vec3(173.31,319.73,97.17));
  float depth=mix(7.5,14.5,random.z);
  vec2 ndc=mod(random.xy*2.0+vec2(time*.003,-time*.002),2.0)-1.0;
  return vec3(ndc*depth/vec2(projection[0][0],projection[1][1]),-depth);
}
`;

// High tier only: persistent view-space displacement, advected by the fluid.
export const simulationShader = /* glsl */ `
uniform sampler2D uOffsets, uTargets, uVelocity;
uniform float uDt, uTime, uTransitionProgress;
uniform mat4 uModelView, uProjection;
varying vec2 vUv;
${galaxyFunctions}
void main(){
  vec4 target=texture2D(uTargets,vUv);
  bool ambient=target.w>=.8;
  vec3 galaxy=galaxyPosition(target.w,uProjection,uTime);
  vec3 base=ambient?galaxy:mix((uModelView*vec4(target.xyz,1)).xyz,galaxy,uTransitionProgress);
  vec3 offset=texture2D(uOffsets,vUv).xyz;
  vec4 clip=uProjection*vec4(base+offset,1);
  vec2 uv=clip.xy/max(clip.w,.1)*.5+.5;
  vec2 flow=vec2(0);
  if(all(greaterThanEqual(uv,vec2(0)))&&all(lessThanEqual(uv,vec2(1))))flow=texture2D(uVelocity,uv).xy;
  vec2 push=flow*max(-base.z,.1)*2.0/vec2(uProjection[0][0],uProjection[1][1]);
  push*=min(1.0,2.0/max(length(push),.001));
  offset.xy+=push*uDt;
  offset*=exp(-uDt*(ambient?2.0:8.0));
  gl_FragColor=vec4(offset,1);
}`;

export const vertexShader = /* glsl */ `
uniform float uTime, uPixelRatio, uTransitionProgress, uMotion, uMouseActive;
#ifdef HIGH_PHYSICS
uniform sampler2D uOffsets;
attribute vec2 aLookup;
#else
uniform vec2 uMouse; // NDC, [-1, 1].
uniform vec3 uMouseView; // Raycast hit in the same view space as the particle.
uniform float uHoverRadius, uMouseStrength;
#endif
attribute vec3 aTargetPos, aTargetNormal;
attribute float aRandom;
varying mediump float vLight, vAmbient;
${galaxyFunctions}
void main(){
  bool ambient=aRandom>=.8;
  float phase=aRandom*6.2831853;
  // Three sine waves replace dozens of 3D noise/gradient evaluations.
  vec3 breathing=sin(aTargetPos.yzx*2.5+vec3(uTime*.8,uTime*.63,uTime*.71)+phase);
  vec3 current=aTargetPos+breathing*.035*uMotion;
  current=mix(current,aTargetPos,.35);
  vec3 galaxy=galaxyPosition(aRandom,projectionMatrix,uTime);
  vec3 view=ambient?galaxy:mix((modelViewMatrix*vec4(current,1)).xyz,galaxy,uTransitionProgress);
#ifdef HIGH_PHYSICS
  view+=texture2D(uOffsets,aLookup).xyz;
#else
  // Dust uses the pointer ray at its own depth; the workstation uses the proxy hit.
  vec3 pointer=ambient?vec3(uMouse*(-view.z)/vec2(projectionMatrix[0][0],projectionMatrix[1][1]),view.z):uMouseView;
  vec3 away=view-pointer;
  float distanceToPointer=length(away);
  float influence=1.0-smoothstep(0.0,uHoverRadius,distanceToPointer);
  vec3 radialNormal=away/max(distanceToPointer,.0001);
  // Stateless, bounded displacement: targets cannot drift, and release restores them.
  view+=radialNormal*influence*influence*uMouseStrength*uMouseActive*uMotion;
#endif
  gl_Position=projectionMatrix*vec4(view,1);
  float light=ambient?.35:.3+.65*abs(dot(aTargetNormal,normalize(vec3(.4,.6,1))));
  vLight=clamp(light+breathing.x*.04*uMotion,0.,1.);vAmbient=ambient?1.:0.;
  float size=mix(3.,14.,fract(aRandom*97.31))*mix(.55,1.4,vLight);
  gl_PointSize=clamp(size*uPixelRatio/max(gl_Position.w,.1),.65*uPixelRatio,4.*uPixelRatio);
}`;

export const fragmentShader = /* glsl */ `
#ifdef MOBILE_FRAGMENT
precision mediump float;
#endif
uniform vec3 uDark,uCyan;
varying mediump float vLight,vAmbient;
void main(){
 float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
 float alpha=(1.-smoothstep(.05,1.,r))*mix(.1,.045,vAmbient)*mix(.4,1.,vLight);
 gl_FragColor=vec4(mix(uDark,uCyan,vLight),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
