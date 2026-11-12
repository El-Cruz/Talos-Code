/** Independent XY positions, visibility and drift phase; uploaded only once. */
export function bakeGalaxy(count: number) {
  const data = new Float32Array(count * 4);
  let seed = 8173;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = (seed >>> 8) / 16777216;
  }
  return data;
}
