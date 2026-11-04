import * as THREE from "three";
import { simulationShader } from "./monitorShaders";

export const PARTICLE_TEXTURE_SIZE = 1024;

export class ParticleSimulation {
  private targets = [0, 1, 2].map(() => new THREE.WebGLRenderTarget(PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE, {
    type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    depthBuffer: false, stencilBuffer: false,
  }));
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private geometry = new THREE.PlaneGeometry(2, 2);
  private material = new THREE.ShaderMaterial({
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0,1);}",
    fragmentShader: simulationShader, depthTest: false, depthWrite: false,
    uniforms: {
      uPositions: { value: null as THREE.Texture | null }, uVelocity: { value: null as THREE.Texture | null },
      uOrigins: { value: null as THREE.Texture | null }, uRestoreSpeed: { value: 0 },
      uTime: { value: 0 }, uDt: { value: 0 }, uInitialize: { value: 1 },
      uBurst: { value: 0 }, uBurstKick: { value: 0 },
      uModelView: { value: new THREE.Matrix4() }, uProjection: { value: new THREE.Matrix4() }, uViewToLocal: { value: new THREE.Matrix4() },
    },
  });
  private previousBurst = 0;
  constructor(private renderer: THREE.WebGLRenderer, seed: THREE.Texture) {
    this.material.uniforms.uPositions.value = seed;
    this.material.uniforms.uOrigins.value = seed;
    const quad = new THREE.Mesh(this.geometry, this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
    const previous = renderer.getRenderTarget();
    try {
      for (const target of this.targets) {
        renderer.setRenderTarget(target);
        const gl = renderer.getContext();
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Particle float framebuffer incomplete");
      }
    } catch (error) { this.dispose(); throw error; }
    finally { renderer.setRenderTarget(previous); }
  }
  step(dt: number, time: number, burst: number, velocity: THREE.Texture, modelView: THREE.Matrix4, projection: THREE.Matrix4) {
    const u = this.material.uniforms;
    u.uDt.value = dt; u.uTime.value = time; u.uBurst.value = burst;
    // ~22% correction per 60Hz frame, with a nonzero spring even during bursts.
    u.uRestoreSpeed.value = 1 - Math.exp(-15 * dt * (1 - 0.65 * burst));
    u.uBurstKick.value = Math.max(0, burst - this.previousBurst); this.previousBurst = burst;
    u.uVelocity.value = velocity;
    u.uModelView.value.copy(modelView); u.uProjection.value.copy(projection); u.uViewToLocal.value.copy(modelView).invert();
    const previous = this.renderer.getRenderTarget();
    if (u.uInitialize.value === 1) {
      this.renderer.setRenderTarget(this.targets[2]); this.renderer.render(this.scene, this.camera);
      u.uOrigins.value = this.targets[2].texture;
    }
    this.renderer.setRenderTarget(this.targets[1]); this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(previous);
    [this.targets[0], this.targets[1]] = [this.targets[1], this.targets[0]];
    u.uPositions.value = this.targets[0].texture; u.uInitialize.value = 0;
    return this.targets[0].texture;
  }
  dispose() { this.targets.forEach(target => target.dispose()); this.geometry.dispose(); this.material.dispose(); }
}
