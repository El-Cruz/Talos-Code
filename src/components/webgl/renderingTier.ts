export type RenderingTier = 1 | 2 | 3;

export function chooseRenderingTier(input: {
  mobile: boolean; limited: boolean; dedicated: boolean; webgpu?: boolean; webgl2?: boolean;
}): RenderingTier {
  if (input.mobile || input.limited || !input.dedicated) return 3;
  if (input.webgpu) return 1;
  return input.webgl2 ? 2 : 3;
}
