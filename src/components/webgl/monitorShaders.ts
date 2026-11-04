export const fieldFunctions = /* glsl */ `
float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float opUnion(float a, float b) { return min(a, b); }
float monitorSDF(vec3 p) {
  float casing = sdRoundBox(p, vec3(1.35, 1.0, 0.7), 0.16);
  // +Z is the front. The cut ends inside the case, leaving an inset screen surface.
  float screen = sdRoundBox(p - vec3(0.0, 0.06, 0.84), vec3(1.15, 0.78, 0.20), 0.10);
  float shell = max(casing, -screen);
  float neck = sdRoundBox(p - vec3(0.0, -1.32, -0.12), vec3(0.25, 0.22, 0.25), 0.07);
  float foot = sdRoundBox(p - vec3(0.0, -1.58, 0.0), vec3(0.76, 0.06, 0.48), 0.08);
  float monitor = opUnion(shell, opUnion(neck, foot));
  vec3 keyboardPos = p - vec3(-0.12, -1.87, 1.35);
  // Inverse X rotation: the rear edge sits higher than the front edge.
  float c = cos(0.16), s = sin(0.16);
  keyboardPos.yz = mat2(c, -s, s, c) * keyboardPos.yz;
  float keyboard = sdRoundBox(keyboardPos, vec3(1.12, 0.09, 0.43), 0.08);
  float mouse = sdRoundBox(p - vec3(1.55, -1.82, 1.4), vec3(0.18, 0.1, 0.29), 0.12);
  return opUnion(monitor, opUnion(keyboard, mouse));
}
vec3 gradient(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  vec3 g = vec3(monitorSDF(p+e.xyy)-monitorSDF(p-e.xyy),
                monitorSDF(p+e.yxy)-monitorSDF(p-e.yxy),
                monitorSDF(p+e.yyx)-monitorSDF(p-e.yyx)) / (2.0*e.x);
  return g / max(length(g), 0.00001);
}
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
vec3 potential(vec3 p) { return vec3(noise(p), noise(p+vec3(31.4,17.1,8.3)), noise(p+vec3(11.7,43.2,29.6))); }
// Bridson-style divergence-free field: curl of a smooth vector noise potential.
vec3 curl(vec3 p) {
  float e=0.04;
  vec3 dx=(potential(p+vec3(e,0,0))-potential(p-vec3(e,0,0)))/(2.0*e);
  vec3 dy=(potential(p+vec3(0,e,0))-potential(p-vec3(0,e,0)))/(2.0*e);
  vec3 dz=(potential(p+vec3(0,0,e))-potential(p-vec3(0,0,e)))/(2.0*e);
  return vec3(dy.z-dz.y, dz.x-dx.z, dx.y-dy.x);
}
`;

export const simulationShader = /* glsl */ `
uniform sampler2D uPositions, uVelocity, uOrigins;
uniform float uTime, uDt, uInitialize, uBurst, uRestoreSpeed;
uniform mat4 uModelView, uProjection, uViewToLocal;
varying vec2 vUv;
${fieldFunctions}
vec2 flowAt(vec2 uv) {
  vec2 texel=vec2(1.0/128.0), p=uv/texel-.5, f=fract(p), b=(floor(p)+.5)*texel;
  return mix(mix(texture2D(uVelocity,b).xy,texture2D(uVelocity,b+vec2(texel.x,0)).xy,f.x),
    mix(texture2D(uVelocity,b+vec2(0,texel.y)).xy,texture2D(uVelocity,b+texel).xy,f.x),f.y);
}
void main(){
  vec4 state=texture2D(uPositions,vUv);
  vec3 pos=state.xyz; bool ambient=state.w>=.8;
  if(uInitialize>.5){
    if(ambient){
      float depth=7.5+hash(pos+4.3)*7.0;
      vec2 ndc=vec2(hash(pos+1.7),hash(pos+9.2))*2.0-1.0;
      pos=(uViewToLocal*vec4(ndc*depth/vec2(uProjection[0][0],uProjection[1][1]),-depth,1)).xyz;
    }else{for(int i=0;i<16;i++){pos-=gradient(pos)*monitorSDF(pos)*.5;}}
  }else{
    vec4 view=uModelView*vec4(pos,1), clip=uProjection*view;
    vec2 uv=clip.xy/clip.w*.5+.5;
    vec2 flow=flowAt(clamp(uv,0.,1.));
    if(any(lessThan(uv,vec2(0))) || any(greaterThan(uv,vec2(1))))flow=vec2(0);
    vec2 viewFlow=flow*max(-view.z,.1)*2.0/vec2(uProjection[0][0],uProjection[1][1]);
    vec3 displacement=(uViewToLocal*vec4(viewFlow,0,0)).xyz;
    // Bound world-space fluid speed, including on narrow/mobile frustums.
    displacement*=min(1.0,(ambient?2.0:0.9)/max(length(displacement),.001));
    pos+=displacement*uDt;
    vec3 breathing=curl(pos*1.35+vec3(uTime*.12));
    breathing/=max(1.0,length(breathing));
    pos+=breathing*uDt*(ambient?.12:.06);
    if(!ambient){
      // The home tether also restores surface coverage after particles cross between objects.
      pos=mix(pos,texture2D(uOrigins,vUv).xyz,1.0-exp(-uDt*18.0*(1.0-uBurst)));
      vec3 targetSDFSurface=pos;
      for(int i=0;i<2;i++)targetSDFSurface-=gradient(targetSDFSurface)*monitorSDF(targetSDFSurface);
      pos+=(targetSDFSurface-pos)*uRestoreSpeed;
    }else{
      // Wrap dust in view space so all screen regions remain populated after resizing.
      vec4 dust=uModelView*vec4(pos,1);
      dust.z=-7.5-mod(-dust.z-7.5,7.0);
      vec2 bounds=(-dust.z)/vec2(uProjection[0][0],uProjection[1][1]);
      dust.xy=mod(dust.xy+bounds,2.0*bounds)-bounds;
      pos=(uViewToLocal*dust).xyz;
    }
  }
  gl_FragColor=vec4(pos,state.w);
}`;

export const vertexShader = /* glsl */ `
uniform sampler2D uPositions, uDensity;
uniform float uTime, uPixelRatio, uFallback, uTransitionProgress;
attribute vec2 aLookup;
attribute float aRandom;
varying float vLight, vAmbient;
${fieldFunctions}
void main(){
  vec3 pos=texture2D(uPositions,aLookup).xyz;
  bool ambient=aRandom>=.8;
  if(uFallback>.5){
    if(ambient){
      float depth=6.0+hash(pos)*10.0;
      vec2 ndc=vec2(hash(pos+1.7),hash(pos+9.2))*2.-1.;
      vec4 view=vec4(ndc*depth/vec2(projectionMatrix[0][0],projectionMatrix[1][1]),-depth,1);
      gl_Position=projectionMatrix*view;
      gl_PointSize=uPixelRatio;vLight=.25;vAmbient=1.;return;
    }
    for(int i=0;i<16;i++){pos-=gradient(pos)*monitorSDF(pos)*.5;}
  }
  vec3 turbulence=curl(pos*1.35+vec3(uTime*.18));
  pos+=turbulence/max(1.0,length(turbulence))*(ambient?.012:.004);
  // Small render detail precedes the spring; persistent motion lives in the GPU state.
  if(!ambient)pos-=gradient(pos)*monitorSDF(pos)*.35;
  vec4 view=modelViewMatrix*vec4(pos,1);
  // Map a wide [-3,3] galaxy plane to the entire frustum at each depth.
  vec3 galaxySeed=vec3(hash(vec3(aLookup,1.7)),hash(vec3(aLookup,9.2)),hash(vec3(aLookup,4.3)));
  vec2 galaxyXY=galaxySeed.xy*6.0-3.0;
  float galaxyZ=mix(-5.0,2.0,galaxySeed.z);
  float depth=9.5-galaxyZ;
  vec3 galaxy=vec3((galaxyXY/3.0)*depth/vec2(projectionMatrix[0][0],projectionMatrix[1][1]),-depth);
  galaxy+=curl(galaxy*.35+vec3(uTime*.025))*.035;
  if(!ambient)view.xyz=mix(view.xyz,galaxy,uTransitionProgress);
  gl_Position=projectionMatrix*view;
  vec2 uv=gl_Position.xy/gl_Position.w*.5+.5;
  float density=texture2D(uDensity,clamp(uv,0.,1.)).x;
  float lighting=ambient?.25:.25+.65*abs(dot(gradient(pos),normalize(vec3(.4,.6,1))));
  vLight=clamp(lighting+density*.12+length(turbulence)*.08,0.,1.);
  vAmbient=ambient?1.:0.;
  float variation=fract(aRandom*97.31);
  float size=mix(3.0,15.0,pow(variation,2.0))*mix(.55,1.4,vLight)*(1.+min(length(turbulence),2.)*.15);
  gl_PointSize=clamp(size*uPixelRatio/max(gl_Position.w,.1),.65*uPixelRatio,4.*uPixelRatio);
}`;

export const fragmentShader = /* glsl */ `
uniform vec3 uDark, uCyan;
varying float vLight, vAmbient;
void main(){
 float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
 float alpha=exp(-r*r*4.)*mix(.13,.045,vAmbient)*mix(.4,1.,vLight);
 gl_FragColor=vec4(mix(uDark,uCyan,vLight),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

