/** Milliseconds since the first rendered galaxy frame; hidden time is excluded. */
export function bootState(age: number) {
  const t = Math.max(0, age);
  const assembling = Math.min(1, Math.max(0, (t - 1250) / 750));
  const scatter = 1 - assembling * assembling * (3 - 2 * assembling);
  const explosion = t < 500 ? 0 : t < 1000
    ? 1 - (1 - (t - 500) / 500) ** 4 : scatter;
  // A continuous clock: freeze preserves positions and slows drift fiftyfold.
  const driftTime = (Math.min(t, 1000) + Math.min(Math.max(t - 1000, 0), 250) * .02 +
    Math.min(Math.max(t - 1250, 0), 750)) / 1000;
  const stage = t < 500 ? "QUANTUM_GALAXY" : t < 1000 ? "DATA_EXPLOSION" :
    t < 1250 ? "QUANTUM_FREEZE" : t < 2000 ? "MAGNETIC_REASSEMBLY" : "UI_ACTIVE";
  return { stage, scatter, explosion, driftTime };
}
