/** Visible milliseconds since GPU compilation. No timers or per-particle state. */
export function bootState(age: number) {
  const t = Math.max(0, age);
  const build = Math.min(1, Math.max(0, (t - 850) / 1500));
  const illumination = Math.min(1, Math.max(0, (t - 500) / 350));
  const stage = t < 500 ? "DESTROYED" : t < 850 ? "IGNITION" : t < 2350 ? "ASSEMBLING" : "ASSEMBLED";
  return { stage, scatter: 1 - build, illumination, driftTime: Math.min(t, 2350) / 1000 };
}

/** Called with elapsed time AFTER the actual title reveal, never boot elapsed time. */
export function heroPose(titleAge: number | null) {
  const t = Math.min(1, Math.max(0, (titleAge ?? 0) / 1000));
  return t * t * (3 - 2 * t);
}
