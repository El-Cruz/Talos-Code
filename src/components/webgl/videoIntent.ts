// Normalized viewport distances and seconds; independent of touch event frequency.
export function addVideoIntent(intent: number, speed: number, dt: number) {
  return Math.min(1, Math.max(0, intent) + Math.min(4, Math.max(0, speed)) * Math.min(.1, Math.max(0, dt)) * 2);
}

export function stepVideoIntent(intent: number, rate: number, dt: number) {
  const elapsed = Math.min(.1, Math.max(0, dt));
  const energy = intent * Math.exp(-3 * elapsed);
  const target = 1 + .5 * energy;
  return { intent: energy, rate: Math.max(1, Math.min(1.5, rate + (target - rate) * (1 - Math.exp(-8 * elapsed)))) };
}
