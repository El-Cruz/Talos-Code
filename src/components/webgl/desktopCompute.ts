import * as THREE from "three/webgpu";
import { Fn, If, abs, cos, exp, float, instanceIndex, instancedArray, length, max, min, mix, sin, smoothstep, uniform, uv, vec3, vec4 } from "three/tsl";
import type { Node } from "three/webgpu";
import { bakeWorkstation } from "./bakeWorkstation";
import { bakeGalaxy } from "./bakeGalaxy";
import { bakeTabShapes } from "./bakeTabShapes";

const roundBox = (p: Node<"vec3">, b: Node<"vec3">, radius: number) => {
  const q = abs(p).sub(b);
  return length(max(q, 0)).add(min(max(q.x, max(q.y, q.z)), 0)).sub(radius);
};

// Explicit function layout prevents six copies of the workstation from being inlined.
export const workstationSDF = Fn(([p]: [Node<"vec3">]) => {
  const casing = roundBox(p, vec3(1.35, 1, .7), .16);
  const aperture = roundBox(p.sub(vec3(0, .06, .85)), vec3(1.18, .8, .24), .07);
  const monitor = max(casing, aperture.negate());
  const neck = roundBox(p.sub(vec3(0, -1.32, -.12)), vec3(.25, .22, .25), .07);
  const stand = roundBox(p.sub(vec3(0, -1.58, 0)), vec3(.76, .06, .48), .08);
  const k = p.sub(vec3(-.12, -1.87, 1.35));
  const keyboardLocal = vec3(k.x, k.y.mul(Math.cos(.16)).sub(k.z.mul(Math.sin(.16))), k.y.mul(Math.sin(.16)).add(k.z.mul(Math.cos(.16))));
  const keyboard = roundBox(keyboardLocal, vec3(1.12, .09, .43), .08);
  const mouse = roundBox(p.sub(vec3(1.55, -1.82, 1.4)), vec3(.18, .1, .29), .12);
  return min(min(min(monitor, neck), stand), min(keyboard, mouse));
}).setLayout({ name: "talosWorkstationSDF", type: "float", inputs: [{ name: "p", type: "vec3" }] });

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
  const targets = instancedArray(seeds, "vec4").toReadOnly();
  const positions = instancedArray(count, "vec4");
  const velocities = instancedArray(count, "vec4");
  const dt = uniform(0), time = uniform(0), transition = uniform(1), motion = uniform(1);
  const pointer = uniform(new THREE.Vector3()), pointerActive = uniform(0);
  const illumination = uniform(0);
  const weights = uniform(new THREE.Vector3(1,0,0));
  const shapes = bakeTabShapes(count);
  const database = instancedArray(shapes.database, "vec4").toReadOnly().toAttribute();
  const atom = instancedArray(shapes.atom, "vec4").toReadOnly().toAttribute();

  const initialize = Fn(() => {
    positions.element(instanceIndex).assign(targets.element(instanceIndex));
    velocities.element(instanceIndex).assign(vec4(0));
  })().compute(count).setName("Talos initialize");

  const update = Fn(() => {
    // Snapshot BOTH inputs before any writes. TF reads old buffers, WGSL writes in-place.
    const target = targets.element(instanceIndex).toVar();
    const p = positions.element(instanceIndex).xyz.toVar();
    const v = velocities.element(instanceIndex).xyz.toVar();
    const phase = p.mul(1.7).add(time.mul(.22));
    const flow = curl(phase).add(curl(phase.mul(2.13).add(vec3(5.2, 1.3, 7.1))).mul(.35));
    const force = flow.mul(.32).toVar();
    If(target.w.lessThan(.8), () => {
      const e = .006;
      const gradient = vec3(
        workstationSDF(p.add(vec3(e, 0, 0))).sub(workstationSDF(p.sub(vec3(e, 0, 0)))),
        workstationSDF(p.add(vec3(0, e, 0))).sub(workstationSDF(p.sub(vec3(0, e, 0)))),
        workstationSDF(p.add(vec3(0, 0, e))).sub(workstationSDF(p.sub(vec3(0, 0, e)))),
      );
      const normal = gradient.div(max(length(gradient), .00001));
      force.addAssign(normal.mul(workstationSDF(p)).mul(-55));
      // A gentle tether prevents particles migrating to a different union component.
      force.addAssign(target.xyz.sub(p).mul(9));
    }).Else(() => {
      force.addAssign(target.xyz.sub(p).mul(.3));
    });
    const away = p.sub(pointer);
    const distance = length(away);
    force.addAssign(away.div(max(distance, .001)).mul(float(1).sub(smoothstep(0, .8, distance))).mul(pointerActive).mul(12));
    v.addAssign(force.mul(dt).mul(motion));
    v.mulAssign(exp(dt.mul(-5)));
    v.mulAssign(min(1, float(3).div(max(length(v), .001))));
    p.addAssign(v.mul(dt));
    positions.element(instanceIndex).assign(vec4(p, target.w));
    velocities.element(instanceIndex).assign(vec4(v, 0));
  })().compute(count).setName("Talos analytic flow and SDF spring");

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });
  const stored = positions.toAttribute();
  const seed = stored.w;
  const fieldSeed = instancedArray(bakeGalaxy(count), "vec4").toReadOnly().toAttribute();
  // Destroyed fragments lie on a common ground plane, just below the CRT feet.
  const ground = vec3(fieldSeed.x.sub(.5).mul(10), -2.15, fieldSeed.y.sub(.5).mul(6));
  const build = smoothstep(fieldSeed.z.mul(.3), fieldSeed.z.mul(.3).add(.7), float(1).sub(transition));
  const lift = sin(build.mul(Math.PI)).mul(fieldSeed.w.mul(.6).add(.3));
  const drift = vec3(sin(time.mul(.6).add(fieldSeed.w.mul(61))), 0, cos(time.mul(.45).add(fieldSeed.w.mul(37)))).mul(.035);
  const debris = ground.add(drift);
  const away = debris.sub(pointer);
  const distance = length(away);
  const repulsion = away.div(max(distance, .001)).mul(float(1).sub(smoothstep(0, 1.4, distance))).mul(pointerActive).mul(.45);
  const shape = stored.xyz.mul(weights.x).add(database.xyz.mul(weights.y)).add(atom.xyz.mul(weights.z));
  material.positionNode = mix(debris.add(repulsion), shape, build).add(vec3(0, lift, 0));
  material.scaleNode = seed.mul(97.31).fract().mul(.018).add(.012);
  const lit = smoothstep(fieldSeed.z.mul(.6), fieldSeed.z.mul(.6).add(.4), illumination);
  const cyberColor = mix(vec3(.4, 1, 1), vec3(1, .4, 0), smoothstep(.85, .95, fieldSeed.w).mul(float(1).sub(build.mul(.7))));
  material.colorNode = mix(vec3(.025, .04, .065), cyberColor, lit);
  material.opacityNode = float(1).sub(smoothstep(.08, .5, length(uv().sub(.5)))).mul(.04 * Math.sqrt(262144 / count))
    .mul(mix(.3, 1, lit));
  const particles = new THREE.Sprite(material);
  particles.count = count;
  particles.frustumCulled = false;
  return { positions, velocities, targets, initialize, update, particles, material, dt, time, transition, motion, pointer, pointerActive, illumination, weights };
}
