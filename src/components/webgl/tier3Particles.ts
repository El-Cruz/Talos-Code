export const TIER3_PARTICLE_COUNT = 12_000;

export function createParticleSeeds() {
  const data = new Float32Array(TIER3_PARTICLE_COUNT * 3);
  let seed = 731;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    // 24-bit values remain strictly below one when stored in Float32.
    data[i] = (seed >>> 8) / 16777216;
  }
  return data;
}

export function nextResolutionScale(scale: number, gpuMs: number) {
  if (gpuMs <= 4) return scale;
  return scale <= .4 ? 0 : Math.max(.4, scale * .75);
}
