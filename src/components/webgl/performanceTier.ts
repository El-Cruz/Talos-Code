export type PerformanceTier = {
  name: "mobile" | "standard" | "high";
  particleSize: 256 | 512 | 1024;
  fluidSize: 64 | 128;
  pressureIterations: 2 | 5;
};

export function selectPerformanceTier({ width, cores = 4, mobile = false, memory }: {
  width: number; cores?: number; mobile?: boolean; memory?: number;
}): PerformanceTier {
  if (width < 768 || mobile) return { name: "mobile", particleSize: 256, fluidSize: 64, pressureIterations: 2 };
  // CPU count is only a proxy: reserve 1M particles for wide, well-provisioned desktops.
  if (width >= 1440 && cores >= 16 && (memory === undefined || memory >= 8)) {
    return { name: "high", particleSize: 1024, fluidSize: 128, pressureIterations: 5 };
  }
  return { name: "standard", particleSize: 512, fluidSize: 64, pressureIterations: 5 };
}
