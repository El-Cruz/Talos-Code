export const tabs = ["SYSTEM", "ARCHIVE", "CORE", "TERMINAL"] as const;
export type Tab = typeof tabs[number];
export type Weights = [number, number, number];
export type MorphTarget = { shape: "pc" | "database" | "atom"; position: [number, number, number]; rotation: [number, number, number]; scale: number };
export type MorphRequest = { id: number; tab: Tab; target: MorphTarget };
export const MORPH_DURATION = 1000;

export function tabTarget(tab: Tab, mobile: boolean): MorphTarget {
  if (tab === "TERMINAL") return { shape: "pc", position: [0,-.45,0], rotation: [0,0,0], scale: mobile ? 2.2 : 2.7 };
  const shape = tab === "ARCHIVE" ? "database" : tab === "CORE" ? "atom" : "pc";
  return { shape, position: [mobile ? 0 : tab === "CORE" ? -2.1 : tab === "ARCHIVE" ? 2.1 : .9, 0, 0], rotation: [.38,-.55,0], scale: 1 };
}
export function shapeWeights(shape: MorphTarget["shape"]): Weights {
  return shape === "pc" ? [1,0,0] : shape === "database" ? [0,1,0] : [0,0,1];
}
export function blendWeights(from: Weights, to: Weights, t: number): Weights {
  return from.map((value, i) => value + (to[i] - value) * t) as Weights;
}
