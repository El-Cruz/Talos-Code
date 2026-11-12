import * as THREE from "three";
import { simulationShader } from "./monitorShaders";

// Allocated only for High. Lower tiers render entirely from static attributes.
export class ParticleSimulation {
  private targets: THREE.WebGLRenderTarget[];
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private geometry = new THREE.PlaneGeometry(2, 2);
  private material = new THREE.ShaderMaterial({
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0,1);}",
    fragmentShader: simulationShader, depthTest: false, depthWrite: false,
    uniforms: {
      uOffsets: { value: null as THREE.Texture | null }, uTargets: { value: null as THREE.Texture | null }, uVelocity: { value: null as THREE.Texture | null },
      uTime: { value: 0 }, uDt: { value: 0 }, uTransitionProgress: { value: 0 },
      uModelView: { value: new THREE.Matrix4() }, uProjection: { value: new THREE.Matrix4() },
    },
  });
  constructor(private renderer: THREE.WebGLRenderer, target: THREE.DataTexture) {
    const size = target.image.width;
    this.targets = [0, 1].map(() => new THREE.WebGLRenderTarget(size, size, {
      type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false,
    }));
    this.material.uniforms.uTargets.value = target;
    const quad = new THREE.Mesh(this.geometry, this.material); quad.frustumCulled = false; this.scene.add(quad);
    const previous = renderer.getRenderTarget(), color = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
    try {
      renderer.setClearColor(0,0);
      for(const buffer of this.targets){
        renderer.setRenderTarget(buffer);
        const gl = renderer.getContext();
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("Particle framebuffer incomplete");
        renderer.clear();
      }
    } catch(error){this.dispose();throw error;}
    finally{renderer.setRenderTarget(previous);renderer.setClearColor(color,alpha);}
  }
  step(dt: number, time: number, burst: number, velocity: THREE.Texture, modelView: THREE.Matrix4, projection: THREE.Matrix4) {
    const u=this.material.uniforms;
    u.uOffsets.value=this.targets[0].texture;u.uVelocity.value=velocity;
    u.uDt.value=dt*(1-.95*burst);u.uTime.value=time;u.uTransitionProgress.value=burst;
    u.uModelView.value.copy(modelView);u.uProjection.value.copy(projection);
    const previous=this.renderer.getRenderTarget();
    try{this.renderer.setRenderTarget(this.targets[1]);this.renderer.render(this.scene,this.camera);}
    finally{this.renderer.setRenderTarget(previous);}
    [this.targets[0],this.targets[1]]=[this.targets[1],this.targets[0]];
    return this.targets[0].texture;
  }
  dispose(){this.targets.forEach(target=>target.dispose());this.geometry.dispose();this.material.dispose();}
}
