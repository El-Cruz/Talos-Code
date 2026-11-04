export type BurstTransition = { start: number; from: number };
export function burstValue(transition: BurstTransition, now: number): number {
  const age = Math.max(0, now - transition.start);
  if (age < 500) return transition.from + (1-transition.from)*(1-Math.pow(1-age/500, 4));
  if (age < 750) return 1;
  return 1-Math.pow(Math.min(1,(age-750)/750), 2);
}
export function loadingState(age: number) {
  if (age < 500) return { stage: "FLOATING", progress: 1 };
  if (age < 1250) return { stage: "BUILDING", progress: 1-Math.pow((age-500)/750,2) };
  return { stage: age < 2000 ? "HOLD" : "UI_ACTIVE", progress: 0 };
}
