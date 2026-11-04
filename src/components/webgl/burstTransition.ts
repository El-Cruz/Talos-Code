export type BurstTransition = { start: number; from: number };

export function burstValue(transition: BurstTransition, now: number): number {
  const elapsed = Math.max(0, now - transition.start);
  const smoothstep = (t: number) => t * t * (3 - 2 * t);
  if (elapsed < 200) {
    return transition.from + (1 - transition.from) * smoothstep(elapsed / 200);
  }
  const recovery = Math.min(1, (elapsed - 200) / 1500);
  return 1 - smoothstep(recovery);
}
