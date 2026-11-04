import * as THREE from "three";

const CURSOR_RADIUS = 0.028;

const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform sampler2D field, velocity, pressure, divergence, curlField;
uniform vec2 texel, from, to, impulse;
uniform float dt, decay, aspect, splatRadius;
uniform int operation;
vec4 sampleField(vec2 uv){return texture2D(field,clamp(uv,texel*.5,1.-texel*.5));}
void main(){
 vec2 L=vUv-vec2(texel.x,0), R=vUv+vec2(texel.x,0), B=vUv-vec2(0,texel.y), T=vUv+vec2(0,texel.y);
 if(operation==0){
   vec2 back=vUv-dt*texture2D(velocity,vUv).xy;
   // Manual bilinear interpolation also works with nearest-filtered half floats.
   vec2 p=back/texel-.5, f=fract(p), base=(floor(p)+.5)*texel;
   gl_FragColor=mix(mix(sampleField(base),sampleField(base+vec2(texel.x,0)),f.x),mix(sampleField(base+vec2(0,texel.y)),sampleField(base+texel),f.x),f.y)*exp(-decay*dt);
 }else if(operation==1 || operation==2){
   vec2 scale=vec2(aspect,1), a=from*scale, b=to*scale, p=vUv*scale;
   vec2 ab=b-a; float h=clamp(dot(p-a,ab)/max(dot(ab,ab),.000001),0.,1.);
   float weight=exp(-dot(p-a-h*ab,p-a-h*ab)/(splatRadius*splatRadius));
   vec4 value=texture2D(field,vUv);
   if(operation==1) value.xy=clamp(value.xy+impulse*weight,vec2(-3),vec2(3));
   else value.x=min(4.,value.x+weight*.5);
   gl_FragColor=value;
 }else if(operation==3){
   vec2 l=texture2D(velocity,L).xy, r=texture2D(velocity,R).xy, b=texture2D(velocity,B).xy, t=texture2D(velocity,T).xy;
   if(L.x<0.)l.x=-texture2D(velocity,vUv).x;if(R.x>1.)r.x=-texture2D(velocity,vUv).x;
   if(B.y<0.)b.y=-texture2D(velocity,vUv).y;if(T.y>1.)t.y=-texture2D(velocity,vUv).y;
   gl_FragColor=vec4((r.x-l.x)/(2.*texel.x)+(t.y-b.y)/(2.*texel.y),0,0,1);
 }else if(operation==4){
   float x=texel.x*texel.x,y=texel.y*texel.y;
   float p=((texture2D(pressure,L).x+texture2D(pressure,R).x)*y+(texture2D(pressure,B).x+texture2D(pressure,T).x)*x-texture2D(divergence,vUv).x*x*y)/(2.*(x+y));
   gl_FragColor=vec4(p,0,0,1);
 }else if(operation==6){
   float omega=(texture2D(velocity,R).y-texture2D(velocity,L).y)/(2.*texel.x)
              -(texture2D(velocity,T).x-texture2D(velocity,B).x)/(2.*texel.y);
   gl_FragColor=vec4(omega,0,0,1);
 }else if(operation==7){
   vec2 eta=vec2(abs(texture2D(curlField,R).x)-abs(texture2D(curlField,L).x),abs(texture2D(curlField,T).x)-abs(texture2D(curlField,B).x));
   eta/=max(length(eta),.00001);
   float omega=texture2D(curlField,vUv).x;
   vec2 force=vec2(eta.y,-eta.x)*omega*.025;
   gl_FragColor=vec4(clamp(texture2D(velocity,vUv).xy+force*dt,vec2(-2),vec2(2)),0,1);
 }else{
   vec2 v=texture2D(velocity,vUv).xy-vec2((texture2D(pressure,R).x-texture2D(pressure,L).x)/(2.*texel.x),(texture2D(pressure,T).x-texture2D(pressure,B).x)/(2.*texel.y));
   if(vUv.x<texel.x || vUv.x>1.-texel.x)v.x=0.;if(vUv.y<texel.y || vUv.y>1.-texel.y)v.y=0.;
   // Frame-rate-independent equivalent of velocity *= .95 at 60Hz.
   gl_FragColor=vec4(v*pow(.95,dt*60.0),0,1);
 }
}`;

export class FluidSimulation {
  private targets: THREE.WebGLRenderTarget[] = [];
  private makeTarget = (size: number) => {
    // Filtering keeps the particle sampler smooth when the fluid grid is downscaled.
    const target = new THREE.WebGLRenderTarget(size, size, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false });
    this.targets.push(target); return target;
  };
  private velocity: THREE.WebGLRenderTarget[];
  private density: THREE.WebGLRenderTarget[];
  private pressure: THREE.WebGLRenderTarget[];
  private divergence: THREE.WebGLRenderTarget;
  private curlTarget: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private geometry = new THREE.PlaneGeometry(2, 2);
  private material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, depthTest: false, depthWrite: false, uniforms: {
    field:{value:null},velocity:{value:null},pressure:{value:null},divergence:{value:null},curlField:{value:null},
    texel:{value:new THREE.Vector2(1/128,1/128)},from:{value:new THREE.Vector2()},to:{value:new THREE.Vector2()},impulse:{value:new THREE.Vector2()},
    dt:{value:0},decay:{value:0},aspect:{value:1},splatRadius:{value:CURSOR_RADIUS},operation:{value:0},
  }});
  constructor(private renderer: THREE.WebGLRenderer, size = 64, private pressureIterations = 5) {
    this.velocity = [this.makeTarget(size), this.makeTarget(size)];
    this.density = [this.makeTarget(size), this.makeTarget(size)];
    this.pressure = [this.makeTarget(size), this.makeTarget(size)];
    this.divergence = this.makeTarget(size);
    this.curlTarget = this.makeTarget(size);
    this.material.uniforms.texel.value.set(1 / size, 1 / size);
    const quad = new THREE.Mesh(this.geometry,this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
    const previous=renderer.getRenderTarget();
    const clearColor = renderer.getClearColor(new THREE.Color());
    const clearAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0, 0);
    try {
      for(const target of this.targets){
        renderer.setRenderTarget(target);
        const gl = renderer.getContext();
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          throw new Error("Half-float fluid framebuffer is incomplete");
        }
        renderer.clear();
      }
    } catch (error) { this.dispose(); throw error; }
    finally { renderer.setRenderTarget(previous); renderer.setClearColor(clearColor, clearAlpha); }
  }
  get velocityTexture(){return this.velocity[0].texture;}
  get densityTexture(){return this.density[0].texture;}
  private pass(operation:number,target:THREE.WebGLRenderTarget){
    this.material.uniforms.operation.value=operation;
    // All sampler uniforms are active in this shared shader, even in unused branches.
    // Never bind the destination attachment as a sampler (WebGL feedback loop).
    const u = this.material.uniforms;
    const source = operation === 0 || operation === 1 || operation === 2 ? u.field.value
      : operation === 4 ? u.pressure.value : u.velocity.value;
    for (const name of ["field", "velocity", "pressure", "divergence", "curlField"]) {
      if (u[name].value === target.texture || u[name].value === null) u[name].value = source;
    }
    this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);
  }
  private swap(pair:THREE.WebGLRenderTarget[]){[pair[0],pair[1]]=[pair[1],pair[0]];}
  splat(from:THREE.Vector2,to:THREE.Vector2,impulse:THREE.Vector2,aspect:number){
    const previous=this.renderer.getRenderTarget(), u=this.material.uniforms;
    u.from.value.copy(from);u.to.value.copy(to);u.impulse.value.copy(impulse);u.aspect.value=aspect;
    u.field.value=this.velocityTexture;this.pass(1,this.velocity[1]);this.swap(this.velocity);
    u.field.value=this.densityTexture;this.pass(2,this.density[1]);this.swap(this.density);
    this.renderer.setRenderTarget(previous);
  }
  step(dt:number){
    const previous=this.renderer.getRenderTarget(),u=this.material.uniforms;
    u.dt.value=dt;u.decay.value=1.2;
    u.field.value=u.velocity.value=this.velocityTexture;this.pass(0,this.velocity[1]);this.swap(this.velocity);
    u.velocity.value=this.velocityTexture;this.pass(6,this.curlTarget);
    u.curlField.value=this.curlTarget.texture;this.pass(7,this.velocity[1]);this.swap(this.velocity);
    u.velocity.value=this.velocityTexture;this.pass(3,this.divergence);
    this.renderer.setRenderTarget(this.pressure[0]);
    const color = this.renderer.getClearColor(new THREE.Color()), alpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0, 0); this.renderer.clear(); this.renderer.setClearColor(color, alpha);
    u.divergence.value=this.divergence.texture;
    for(let i=0;i<this.pressureIterations;i++){u.pressure.value=this.pressure[0].texture;this.pass(4,this.pressure[1]);this.swap(this.pressure);}
    u.pressure.value=this.pressure[0].texture;this.pass(5,this.velocity[1]);this.swap(this.velocity);
    u.velocity.value=this.velocityTexture;u.field.value=this.densityTexture;u.decay.value=1.6;
    this.pass(0,this.density[1]);this.swap(this.density);
    this.renderer.setRenderTarget(previous);
  }
  dispose(){for(const target of this.targets)target.dispose();this.geometry.dispose();this.material.dispose();}
}
