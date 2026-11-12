import * as THREE from "three/webgpu";
import { Fn, color, cos, dot, float, instancedArray, length, max, mix, sin, smoothstep, uniform, uv, varying, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";
import { bakeWorkstation } from "./bakeWorkstation";
import { bakeGalaxy } from "./bakeGalaxy";
import { bakeTabShapes } from "./bakeTabShapes";

// Analytic curl of A=(sin(y)cos(z), sin(z)cos(x), sin(x)cos(y)).
// Two decorrelated octaves form a smooth divergence-free procedural flow.
const curl = Fn(([p]: [Node<"vec3">]) => vec3(
  sin(p.x).mul(sin(p.y)).negate().sub(cos(p.z).mul(cos(p.x))),
  sin(p.y).mul(sin(p.z)).negate().sub(cos(p.x).mul(cos(p.y))),
  sin(p.z).mul(sin(p.x)).negate().sub(cos(p.y).mul(cos(p.z))),
)).setLayout({ name: "talosCurl", type: "vec3", inputs: [{ name: "p", type: "vec3" }] });

export function createDesktopCompute(count: number) {
  const baked = bakeWorkstation(count);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    // Morph targets contain surfaces only; ambient PC points would explode on zoom.
    let source = i;
    while (baked.randoms[source] >= .8) source = (source + 1) % count;
    seeds[i * 4] = baked.targets[source * 3];
    seeds[i * 4 + 1] = baked.targets[source * 3 + 1];
    seeds[i * 4 + 2] = baked.targets[source * 3 + 2];
    seeds[i * 4 + 3] = baked.randoms[i];
  }
  const time = uniform(0), transition = uniform(1), morphDisplacement = uniform(0);
  const pointer = uniform(new THREE.Vector3()), pointerActive = uniform(0);
  const pointerDirection = uniform(new THREE.Vector3(0, 0, -1));
  const illumination = uniform(0);
  const weights = uniform(new THREE.Vector3(1,0,0));
  const shapes = bakeTabShapes(count);
  const database = instancedArray(shapes.database, "vec4").toReadOnly().toAttribute();
  const atom = instancedArray(shapes.atom, "vec4").toReadOnly().toAttribute();

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });
  const stored = instancedArray(seeds, "vec4").toReadOnly().toAttribute();
  const seed = stored.w;
  const fieldSeed = instancedArray(bakeGalaxy(count), "vec4").toReadOnly().toAttribute();
  // Destroyed fragments lie on a common ground plane, just below the CRT feet.
  const ground = vec3(fieldSeed.x.sub(.5).mul(10), -2.15, fieldSeed.y.sub(.5).mul(6));
  const build = smoothstep(fieldSeed.z.mul(.3), fieldSeed.z.mul(.3).add(.7), float(1).sub(transition));
  const lift = sin(build.mul(Math.PI)).mul(fieldSeed.w.mul(.6).add(.3));
  const drift = vec3(sin(time.mul(.6).add(fieldSeed.w.mul(61))), 0, cos(time.mul(.45).add(fieldSeed.w.mul(37)))).mul(.035);
  const debris = ground.add(drift);
  const shape = stored.xyz.mul(weights.x).add(database.xyz.mul(weights.y)).add(atom.xyz.mul(weights.z));
  const base = mix(debris, shape, build).add(vec3(0, lift, 0)).toVar();
  const phase = base.mul(1.7).add(time.mul(.22));
  const flow = curl(phase).add(curl(phase.mul(2.13).add(vec3(5.2, 1.3, 7.1))).mul(.35)).mul(.25).toVar();
  const reordered = base.add(flow.add(vec3(0, .45, 0)).mul(morphDisplacement)).toVar();
  const delta = reordered.sub(pointer);
  const away = delta.sub(pointerDirection.mul(dot(delta, pointerDirection)));
  const distance = length(away);
  const influence = float(1).sub(smoothstep(0, .85, distance)).mul(pointerActive).toVar();
  const tangent = flow.sub(pointerDirection.mul(dot(flow, pointerDirection)));
  // Add interaction AFTER all boot/morph math: it never fades with build progress.
  const repulsion = away.div(max(distance, .04)).mul(.45).add(tangent.mul(.06)).mul(influence);
  material.positionNode = reordered.add(repulsion);
  material.scaleNode = seed.mul(97.31).fract().mul(.018).add(.012);
  const lit = smoothstep(fieldSeed.z.mul(.6), fieldSeed.z.mul(.6).add(.4), illumination);
  const cyan = color("#66FFFF"), orange = color("#FF6600");
  const cyberColor = mix(cyan, orange, smoothstep(.85, .95, fieldSeed.w).mul(float(1).sub(build.mul(.7))));
  // Pass one scalar to the fragment stage instead of repeating curl/pointer math.
  material.colorNode = mix(mix(vec3(.025, .04, .065), cyberColor, lit), orange, varying(influence, "vParticleInteraction"));
  material.opacityNode = float(1).sub(smoothstep(.08, .5, length(uv().sub(.5)))).mul(.04 * Math.sqrt(262144 / count))
    .mul(mix(.3, 1, lit));
  const particles = new THREE.Sprite(material);
  particles.count = count;
  particles.frustumCulled = false;
  return { particles, material, time, transition, pointer, pointerDirection, pointerActive, illumination, weights, morphDisplacement };
}
