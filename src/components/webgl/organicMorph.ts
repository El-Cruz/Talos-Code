/** A bounded displacement envelope; preserve its current value on retargeting. */
export function morphAmplitude(progress: number, carry = 0) {
  const p = Math.max(0, Math.min(1, progress));
  const eased = p * p * (3 - 2 * p);
  return carry * (1 - eased) + .22 * 16 * p * p * (1 - p) * (1 - p);
}
